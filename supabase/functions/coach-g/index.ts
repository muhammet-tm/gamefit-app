// Coach G — the AI fitness coach.
// Server-side enforcement of the free-tier cap (10 requests/month), premium
// verification against Stripe, prompt-injection sanitization, and
// age-appropriate safety behavior. The Anthropic key never leaves the server.
import Stripe from 'npm:stripe@14.21.0';
import {
  corsHeaders, json, getUser, getProfile, serviceClient,
  sanitizeForPrompt, verifyPremium,
} from '../_shared/helpers.ts';

const MODEL = 'claude-haiku-4-5-20251001';
const FREE_MONTHLY_LIMIT = 10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const profile = await getProfile(user.id);
    if (!profile) return json({ error: 'Profile not found' }, 404);

    const body = await req.json();
    const { type } = body;
    if (!['plan', 'nutrition', 'chat', 'meal_analysis'].includes(type)) {
      return json({ error: 'Invalid request type' }, 400);
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
    const isPremium = await verifyPremium(profile, stripe);

    // ---- free-tier cap, enforced server-side with a monthly reset
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!isPremium) {
      if (type === 'meal_analysis') {
        return json({
          error: 'Premium required',
          message: 'Meal photo analysis is a Premium feature. Upgrade to unlock it!',
          premium_required: true,
        }, 403);
      }
      const { count } = await serviceClient()
        .from('ai_request_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('month_key', monthKey);
      if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
        return json({
          error: 'Free tier limit reached',
          message: "You've used your free coaching for this month — upgrade to Premium for unlimited access.",
          premium_required: true,
        }, 429);
      }
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'AI not configured' }, 500);

    // ---- user context comes from the server-side profile, never the client
    const userContext = `

User Profile:
- Gender: ${profile.gender || 'unknown'}
- Age: ${profile.age || 'unknown'}
- Weight: ${profile.weight_kg ? profile.weight_kg + ' kg' : 'unknown'}
- Height: ${profile.height_cm ? profile.height_cm + ' cm' : 'unknown'}
- BMI: ${profile.bmi || 'unknown'}
- Fitness Goal: ${sanitizeForPrompt(profile.fitness_goal) || 'General fitness'}
- Experience Level: ${sanitizeForPrompt(profile.fitness_level) || 'Beginner'}
Always tailor your advice specifically to this user's profile above.`;

    const minorSafety = profile.age && profile.age < 18
      ? `
The user is under 18. Keep all advice conservative and age-appropriate:
moderate training loads only, no supplement recommendations, no calorie
deficits, and encourage involving a parent/guardian or school coach.`
      : '';

    const systemPrompt = `You are Coach G, an expert AI fitness coach inside the GameFit app.
You give personalized, motivating fitness advice. Be concise, practical, and encouraging.

Safety rules (non-negotiable):
- General fitness and nutrition guidance only. Never diagnose medical conditions,
  prescribe medication, or interpret symptoms — refer those to a doctor.
- Respect any injuries or limitations the user mentions; suggest safe alternatives.
- Never recommend extreme calorie deficits (below ~1,400 kcal/day), rapid weight
  loss, overtraining, or dangerous techniques.
- If asked for anything outside fitness/nutrition/wellness, politely steer back.${minorSafety}${userContext}
Always end responses with: "This is general guidance only — not medical advice. Consult a healthcare professional before starting any new exercise program."`;

    // ---- build the message payload per request type
    let messages: Array<{ role: string; content: unknown }>;

    if (type === 'plan') {
      const days = Math.min(Math.max(parseInt(body.days) || 3, 1), 7);
      const sessionDuration = Math.min(Math.max(parseInt(body.sessionDuration) || 45, 10), 180);
      const equipment = Array.isArray(body.equipment)
        ? body.equipment.map((e: unknown) => sanitizeForPrompt(e, 50)).filter(Boolean).slice(0, 10)
        : [];
      const injuries = sanitizeForPrompt(body.injuries, 300);
      messages = [{
        role: 'user',
        content: `Create a ${days}-day per week workout plan with ${sessionDuration}-minute sessions.
Available equipment: ${equipment.join(', ') || 'No Equipment'}.
${injuries ? `Injuries/limitations to consider: ${injuries}.` : ''}
Format it clearly with day names, exercises, sets and reps. Keep it practical and achievable.`,
      }];
    } else if (type === 'nutrition') {
      const mealPreference = sanitizeForPrompt(body.mealPreference, 100);
      const allergies = sanitizeForPrompt(body.allergies, 200);
      messages = [{
        role: 'user',
        content: `Create a simple, practical daily meal plan for one day tailored to my profile and fitness goal.
Dietary preference: ${mealPreference || 'No Restrictions'}.
Allergies / intolerances to avoid: ${allergies || 'None'}.
Structure the response with clearly labeled meal sections: Breakfast, Morning Snack (optional), Lunch, Afternoon Snack (optional), Dinner.
For each meal include: what to eat, rough portion sizes, and an approximate calorie count (e.g. ~500 kcal).
Keep meals simple, realistic, and easy to prepare. Strictly avoid any allergens listed above. Focus on supporting my goal.`,
      }];
    } else if (type === 'meal_analysis') {
      // premium-only (checked above): analyze a meal photo from storage
      const imagePath = String(body.image_path ?? '');
      if (!imagePath.startsWith(`${user.id}/`)) {
        return json({ error: 'Invalid image path' }, 400);
      }
      const { data: blob, error: dlError } = await serviceClient()
        .storage.from('meal-photos').download(imagePath);
      if (dlError || !blob) return json({ error: 'Could not read image' }, 400);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (bytes.length > 5 * 1024 * 1024) return json({ error: 'Image too large (max 5MB)' }, 400);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const mediaType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
      messages = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: btoa(binary) } },
          {
            type: 'text',
            text: `Analyze this meal photo. Respond with ONLY a JSON object (no markdown) shaped exactly like:
{"meal_name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "health_score": number (0-10), "notes": string (one short sentence)}
Estimate portions realistically. If it is not food, use {"meal_name": "Not food", "calories": 0, ...}.`,
          },
        ],
      }];
    } else {
      // chat: forward the conversation, bounded to control cost
      const history = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
      messages = history
        .map((m: { role?: string; content?: unknown }) => ({
          role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content ?? '').slice(0, 2000),
        }))
        .filter((m) => m.content.length > 0);
      if (messages.length === 0) return json({ error: 'Empty message' }, 400);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      console.error('Anthropic API error:', await response.text());
      return json({ error: 'AI request failed' }, 502);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? 'Sorry, I could not generate a response.';

    // ---- count this request for free-tier users (service role only)
    if (!isPremium) {
      await serviceClient().from('ai_request_logs').insert({
        user_id: user.id,
        request_type: type,
        month_key: monthKey,
        logged_date: now.toISOString().slice(0, 10),
      });
    }

    if (type === 'meal_analysis') {
      try {
        const parsed = JSON.parse(text.replace(/```json?|```/g, '').trim());
        return json({ analysis: parsed, meta: { version: 1 } });
      } catch (_) {
        return json({ error: 'Could not analyze this photo — try a clearer shot.' }, 422);
      }
    }

    return json({ reply: text, meta: { version: 1 } });
  } catch (error) {
    console.error('coach-g error:', (error as Error).message);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
