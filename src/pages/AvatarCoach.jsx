import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useGameFit } from '@/lib/GameFitContext';
import { Send, Loader2, Swords, Wind, Zap, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HumanAvatar from '@/components/gamefit/HumanAvatar';
import BottomNav from '@/components/gamefit/BottomNav';
import ScreenHeader from '@/components/gamefit/ScreenHeader';
import ScreenTransition from '@/components/gamefit/ScreenTransition';
import ReactMarkdown from 'react-markdown';

const STAT_CONFIG = [
  { key: 'strength', label: 'STR', icon: Swords, color: '#EF4444', bg: 'rgba(239,68,68,0.15)', fontSize: 'text-xs' },
  { key: 'endurance', label: 'END', icon: Wind, color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', fontSize: 'text-xs' },
  { key: 'agility', label: 'AGI', icon: Zap, color: '#C8FF00', bg: 'rgba(200,255,0,0.15)', fontSize: 'text-xs' },
  { key: 'recovery', label: 'REC', icon: Heart, color: '#22C55E', bg: 'rgba(34,197,94,0.15)', fontSize: 'text-xs' },
];

function StatBar({ stat, value }) {
  const Icon = stat.icon;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
        <Icon size={16} color={stat.color} />
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--gf-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: stat.color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
      <span className={`font-heading font-black ${stat.fontSize}`} style={{ color: stat.color }}>{stat.label}</span>
      <span className="font-body text-[10px]" style={{ color: 'var(--gf-text-secondary)' }}>{value}</span>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-heading font-black"
          style={{ backgroundColor: 'rgba(200,255,0,0.15)', color: 'var(--gf-green)', border: '1px solid rgba(200,255,0,0.3)' }}>
          G
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
        style={{
          backgroundColor: isUser ? 'var(--gf-green)' : 'var(--gf-bg-elevated)',
          color: isUser ? '#0D0F14' : 'var(--gf-text-primary)',
          border: isUser ? 'none' : '1px solid var(--gf-border)',
        }}>
        {isUser ? message.content : (
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              p: ({ children }) => <p className="my-1 leading-relaxed" style={{ color: 'var(--gf-text-primary)' }}>{children}</p>,
              strong: ({ children }) => <strong style={{ color: 'var(--gf-green)' }}>{children}</strong>,
              ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
              li: ({ children }) => <li style={{ color: 'var(--gf-text-primary)' }}>{children}</li>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

const QUICK_PROMPTS = [
  'Analyze my stats & give me a plan',
  'Which stat is weakest?',
  'What should I train today?',
  'How do I level up faster?',
];

export default function AvatarCoach() {
  const { user, workouts } = useGameFit();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ strength: 0, endurance: 0, agility: 0, recovery: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const avatarCfg = user.avatar_config || { gender: 'male', skin: 'light', outfit: 'blue', hair: 'brown' };

  useEffect(() => {
    // Load stats
    base44.functions.invoke('getWorkoutStats', {}).then(res => {
      if (res.data?.stats) setStats(res.data.stats);
    }).catch(() => {}).finally(() => setStatsLoading(false));

    // Create conversation
    base44.agents.createConversation({
      agent_name: 'avatar_coach',
      metadata: { name: 'Avatar Coach Session' }
    }).then(conv => {
      setConversation(conv);
      const unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
        setMessages(data.messages || []);
      });
      return () => unsub();
    }).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || !conversation || loading) return;
    const msg = text.trim();
    setInput('');
    setLoading(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: msg });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const level = user.current_level || 1;
  const tier = level <= 2 ? 1 : level <= 4 ? 2 : level <= 6 ? 3 : level <= 9 ? 4 : 5;

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      <ScreenTransition direction="forward">
        <ScreenHeader 
          title="Avatar Coach" 
          subtitle="AI-powered RPG stat coaching"
          rightAction={<div className="w-10 h-10 overflow-hidden">
            <HumanAvatar {...avatarCfg} tier={tier} size={40} />
          </div>}
        />
      </ScreenTransition>

      {/* Stats Panel */}
      <div className="mx-5 mt-4 rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
        <p className="font-heading font-black text-sm mb-3" style={{ color: 'var(--gf-text-primary)' }}>
          ⚔️ Avatar RPG Stats
        </p>
        {statsLoading ? (
          <div className="flex justify-center py-2"><Loader2 size={18} className="animate-spin" style={{ color: 'var(--gf-text-secondary)' }} /></div>
        ) : (
          <div className="flex gap-3">
            {STAT_CONFIG.map(s => <StatBar key={s.key} stat={s} value={stats[s.key] || 0} />)}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {messages.length === 0 && !loading && (
          <motion.div className="text-center pt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-16 h-16 mx-auto rounded-2xl mb-3 flex items-center justify-center text-2xl font-heading font-black"
              style={{ backgroundColor: 'rgba(200,255,0,0.15)', color: 'var(--gf-green)', border: '1px solid rgba(200,255,0,0.3)' }}>
              G
            </div>
            <p className="font-heading font-black text-lg mb-1" style={{ color: 'var(--gf-text-primary)' }}>Coach G is ready</p>
            <p className="font-body text-sm mb-6" style={{ color: 'var(--gf-text-secondary)' }}>
              Ask me anything about your avatar stats or training plan
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="w-full text-left px-4 py-3 rounded-xl font-body text-sm transition-all active:scale-98"
                  style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)', color: 'var(--gf-text-primary)' }}>
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-heading font-black"
              style={{ backgroundColor: 'rgba(200,255,0,0.15)', color: 'var(--gf-green)', border: '1px solid rgba(200,255,0,0.3)' }}>
              G
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2"
              style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--gf-green)' }} />
              <span className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>Analyzing your stats...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-4" style={{ backgroundColor: 'var(--gf-bg-surface)', borderTop: '1px solid var(--gf-border)' }}>
        <div className="flex gap-3 pt-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask Coach G about your avatar stats..."
            className="flex-1 rounded-xl px-4 py-3 font-body text-sm outline-none"
            style={{
              backgroundColor: 'var(--gf-bg-elevated)',
              border: '1px solid var(--gf-border)',
              color: 'var(--gf-text-primary)',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !conversation}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: 'var(--gf-green)' }}>
            <Send size={16} color="#0D0F14" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}