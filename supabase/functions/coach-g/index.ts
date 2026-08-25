// Coach G — the AI fitness coach.
// Server-side enforcement of the free-tier cap (10 requests/month), a
// fair-use daily ceiling for premium (a cost-abuse guard, not a product
// limit), premium verification against Stripe, prompt-injection
// sanitization, and age-appropriate safety behavior. The Anthropic key
// never leaves the server.
import Stripe from 'npm:stripe@14.21.0';
import {
  withCors, json, getUser, getProfile, serviceClient,
  sanitizeForPrompt, verifyPremium,
} from '../_shared/helpers.ts';

const MODEL = 'claude-haiku-4-5-20251001';
const FREE_MONTHLY_LIMIT = 10;
// Premium ceilings are per day, sized so no human hits them in normal use —
// they exist so one scripted or compromised premium account cannot run
// unbounded Anthropic spend. Meal analysis is capped separately because
// image requests cost an order of magnitude more tokens than text.
const PREMIUM_DAILY_TEXT_LIMIT = 100;
const PREMIUM_DAILY_MEAL_LIMIT = 30;

Deno.serve(withCors(async (req) => {
  // Tracks whether a free-tier credit was reserved, so it can be handed back
  // if the request never produced an answer. Charging for a 502 is a support
  // ticket waiting to happen.
  let reservedUserId: string | null = null;
  let reservedMonthKey: string | null = null;
  const refundCredit = async () => {
    if (!reservedUserId || !reservedMonthKey) return;
    const userId = reservedUserId;
    const monthKey = reservedMonthKey;
    reservedUserId = null; // never refund the same reservation twice
    reservedMonthKey = null;
    try {
      const { data } = await serviceClient()
        .from('ai_request_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('month_key', monthKey)
        .order('created_at', { ascending: false })
        .limit(1);
      const id = data?.[0]?.id;
      if (id) await serviceClient().from('ai_request_logs').delete().eq('id', id);
    } catch (e) {
      // A failed refund must not turn a handled error into an unhandled one.
      console.error('credit refund failed:', (e as Error).message);
    }
  };

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

    // ---- entitlement gate (credits are reserved later, after validation)
    if (!isPremium && type === 'meal_analysis') {
      return json({
        error: 'Premium required',
        message: 'Meal photo analysis is a Premium feature. Upgrade to unlock it!',
        premium_required: true,
      }, 403);
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
- If asked for anything outside fitness/nutrition/wellness, politely steer back.

Formatting rules (the app renders Markdown natively — use it):
- Structure every answer for fast scanning: short paragraphs, **bold** key
  numbers and takeaways, bullet lists, and ### headings for longer answers.
- Whenever you present a plan, schedule, comparison, or macro breakdown,
  use a Markdown table — the app renders real tables.
- When a quantity comparison helps (daily macros, weekly volume), you may
  include ONE chart the app draws natively: a fenced code block with
  language "chart" containing JSON like
  \`\`\`chart
  {"type":"bar","title":"Daily macros (g)","data":[{"label":"Protein","value":140},{"label":"Carbs","value":220},{"label":"Fat","value":70}]}
  \`\`\`
  Supported types: "bar" and "pie". Only add a chart when it genuinely
  clarifies numbers — never decorate.${minorSafety}${userContext}
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

    // ---- reserve a credit atomically, only now that every validation has
    // passed — a request rejected above must never cost anyone a credit.
    // Reserving BEFORE the Anthropic call (rather than logging after) is what
    // makes the cap race-safe: consume_ai_credit takes a per-user advisory
    // lock, so concurrent requests cannot all read the same count and all
    // pass. Free tier counts per calendar month; premium counts per Dubai day
    // (UTC+4 year-round, matching logged_date inside the RPC) in two buckets,
    // because the same table + RPC serve both — the bucket lives in the key.
    const now = new Date();
    const bucket = isPremium
      ? (() => {
          const dubaiDay = new Date(now.getTime() + 4 * 60 * 60 * 1000)
            .toISOString().slice(0, 10);
          return type === 'meal_analysis'
            ? { key: `day:${dubaiDay}:meal`, limit: PREMIUM_DAILY_MEAL_LIMIT }
            : { key: `day:${dubaiDay}:text`, limit: PREMIUM_DAILY_TEXT_LIMIT };
        })()
      : {
          key: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          limit: FREE_MONTHLY_LIMIT,
        };
    const { data: granted, error: creditError } = await serviceClient()
      .rpc('consume_ai_credit', {
        p_user_id: user.id,
        p_request_type: type,
        p_month_key: bucket.key,
        p_limit: bucket.limit,
      });
    if (creditError) {
      console.error('consume_ai_credit failed:', creditError.message);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
    if (granted === false) {
      if (isPremium) {
        return json({
          error: 'Daily limit reached',
          message: "You've reached today's fair-use limit for Coach G — it resets at midnight (GST). See you tomorrow!",
        }, 429);
      }
      return json({
        error: 'Free tier limit reached',
        message: "You've used your free coaching for this month — upgrade to Premium for unlimited access.",
        premium_required: true,
      }, 429);
    }
    reservedUserId = user.id;
    reservedMonthKey = bucket.key;

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
      // Log the status, not the body. The body is an upstream error document
      // that can echo request content back into our logs.
      console.error('Anthropic API error, status:', response.status);
      await refundCredit();
      return json({ error: 'AI request failed' }, 502);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? 'Sorry, I could not generate a response.';

    // The usage row was already written by consume_ai_credit above, before the
    // Anthropic call, so there is deliberately no insert here.

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
    // The user got no answer, so they should not have been charged for one.
    await refundCredit();
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}));
