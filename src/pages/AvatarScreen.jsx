import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { invokeFunction } from '@/api/supabase';
import BodyAnalysis from '@/components/gamefit/BodyAnalysis';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useGameFit } from '@/lib/GameFitContext';
import { getNextLevelXP, getCurrentLevelXP, getAvatarTier } from '@/lib/mockData';
import Avatar from '@/components/avatar/Avatar';
import { AVATAR_CLASSES, CLASS_LABELS, CLASS_TAGLINES, CLASS_COLORS, SKIN_TONES, HAIR_STYLES, HAIR_COLORS } from '@/components/avatar/palettes';
import { TIER_CONFIG, TIER_BADGES } from '@/components/avatar/tiers';
import { normalizeAvatarConfig } from '@/components/avatar/migrate';
import BottomNav from '@/components/gamefit/BottomNav';
import AccessoryShop, { ACCESSORIES } from '@/components/gamefit/AccessoryShop';

const TABS = ['avatar', 'shop', 'connect'];

const HEALTH_APPS = [
  { id: 'strava',       name: 'Strava',        emoji: '🏃', color: '#FC4C02', desc: 'Sync runs, rides & activities', comingSoon: false, realOAuth: true },
  { id: 'apple_health', name: 'Apple Health',  emoji: '❤️', color: '#FF2D55', desc: 'Steps, heart rate & workouts', comingSoon: true },
  { id: 'whoop',        name: 'WHOOP',         emoji: '⚡', color: '#CDF000', desc: 'Recovery & strain data', comingSoon: true },
  { id: 'garmin',       name: 'Garmin',        emoji: '⌚', color: '#007CC3', desc: 'GPS & performance tracking', comingSoon: true },
];


export default function AvatarScreen() {
  const { user, workouts, updateUser, purchaseAccessory, equipAccessory } = useGameFit();
  const [activeTab, setActiveTab] = useState('avatar');
  const [connectedApps, setConnectedApps] = useState(() => user.connected_apps || []);
  const [connectingApp, setConnectingApp] = useState(null);
  const [shopError, setShopError] = useState('');

  const handleConnect = async (app) => {
    if (app.comingSoon) return;

    // Handle disconnect — the server forgets the Strava tokens
    if (connectedApps.includes(app.id)) {
      const updated = connectedApps.filter(a => a !== app.id);
      setConnectedApps(updated);
      if (app.id === 'strava') {
        invokeFunction('strava-auth', { action: 'disconnect' }).catch(() => {});
      }
      updateUser({ connected_apps: updated }).catch(() => {});
      return;
    }

    // Real Strava OAuth
    if (app.realOAuth && app.id === 'strava') {
      setConnectingApp(app.id);
      try {
        const res = await invokeFunction('strava-auth', { action: 'authorize' });
        if (res?.url) {
          window.location.href = res.url;
        }
      } catch (err) {
        console.error('Strava auth error:', err);
        setConnectingApp(null);
      }
      return;
    }
  };
  const avatarCfg = normalizeAvatarConfig(user.avatar_config);

  const ownedAccessories = user.owned_accessories || [];
  const equippedAccessory = user.equipped_accessory || null;
  const equippedItem = ACCESSORIES.find(a => a.id === equippedAccessory);

  // The server checks the price and coin balance atomically — the UI just
  // asks and shows the result.
  const handleBuyAccessory = async (item) => {
    if (user.coins < item.cost) return;
    setShopError('');
    const res = await purchaseAccessory(item.id);
    if (!res.ok) setShopError(res.error || 'Purchase failed. Please try again.');
  };

  const handleEquipAccessory = async (id) => {
    setShopError('');
    const res = await equipAccessory(id);
    if (!res.ok) setShopError(res.error || 'Could not equip. Please try again.');
  };

  const level = user.current_level;
  const currentLevelXP = getCurrentLevelXP(level);
  const nextLevelXP = getNextLevelXP(level);
  const xpToNext = nextLevelXP - user.total_xp;
  const xpProgress = nextLevelXP > currentLevelXP
    ? ((user.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    : 100;

  const currentTier = getAvatarTier(level);

  const updateAvatar = (key, val) => {
    const newCfg = { ...avatarCfg, version: 2, [key]: val };
    updateUser({ avatar_config: newCfg });
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--gf-bg-primary)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4"
        style={{ backgroundColor: 'var(--gf-bg-surface)', borderBottom: '1px solid var(--gf-border)' }}>
        <div className="flex items-center mb-3">
          <h1 className="font-heading font-black text-2xl" style={{ color: 'var(--gf-text-primary)' }}>🎮 My Avatar</h1>
        </div>
        {/* Tabs */}
        <div className="flex rounded-xl p-1" style={{ backgroundColor: 'var(--gf-bg-elevated)' }}>
          {[['avatar','🎭 Avatar'],['shop','🛒 Shop'],['connect','🔗 Connect']].map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className="flex-1 py-2.5 rounded-lg font-body font-medium text-sm transition-all"
              style={{ backgroundColor: activeTab === t ? 'var(--gf-green)' : 'transparent', color: activeTab === t ? '#0D0F14' : 'var(--gf-text-secondary)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'connect' && (
        <div className="px-5 pt-5 pb-6 space-y-4">
          {/* Header */}
          <div className="rounded-2xl p-4 flex items-center gap-3"
            style={{ backgroundColor: 'rgba(79,195,247,0.08)', border: '1px solid rgba(79,195,247,0.2)' }}>
            <Smartphone size={22} color="#4FC3F7" />
            <div>
              <p className="font-heading font-black text-base" style={{ color: 'var(--gf-text-primary)' }}>Health Connect</p>
              <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                Sync activity data to earn XP automatically
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--gf-bg-elevated)', border: '1px solid var(--gf-border)' }}>
            <p className="font-heading font-black text-sm mb-2" style={{ color: 'var(--gf-text-primary)' }}>How it works</p>
            {[
              { icon: '🔗', text: 'Connect your fitness app below' },
              { icon: '📊', text: 'Your activities sync automatically' },
              { icon: '⚡', text: 'Earn XP & coins for every activity' },
              { icon: '🎭', text: 'Your avatar evolves with your progress' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{step.icon}</span>
                <p className="font-body text-sm" style={{ color: 'var(--gf-text-secondary)' }}>{step.text}</p>
              </div>
            ))}
          </div>

          {/* App list */}
          {HEALTH_APPS.map(app => {
            const isConnected = connectedApps.includes(app.id);
            const isConnecting = connectingApp === app.id;
            return (
              <button key={app.id} onClick={() => handleConnect(app)} disabled={isConnecting || app.comingSoon}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-98 text-left"
                style={{
                  backgroundColor: isConnected ? `${app.color}12` : 'var(--gf-bg-elevated)',
                  border: `1.5px solid ${isConnected ? app.color : 'var(--gf-border)'}`,
                  opacity: app.comingSoon ? 0.5 : 1,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${app.color}20` }}>
                    {app.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-body font-semibold text-sm" style={{ color: 'var(--gf-text-primary)' }}>{app.name}</p>
                      {app.comingSoon && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-body font-semibold"
                          style={{ backgroundColor: 'rgba(255,184,0,0.15)', color: '#FFB800' }}>SOON</span>
                      )}
                    </div>
                    <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>{app.desc}</p>
                  </div>
                </div>
                <div>
                  {isConnecting ? (
                    <span className="text-xs font-body px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${app.color}20`, color: app.color }}>
                      Connecting...
                    </span>
                  ) : isConnected ? (
                    <span className="text-xs font-body font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1"
                      style={{ backgroundColor: `${app.color}20`, color: app.color }}>
                      ✓ Connected
                    </span>
                  ) : app.comingSoon ? (
                    <span className="text-xs font-body px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'var(--gf-border)', color: 'var(--gf-text-secondary)' }}>
                      Soon
                    </span>
                  ) : (
                    <span className="text-xs font-body font-semibold px-3 py-1.5 rounded-xl"
                      style={{ backgroundColor: 'var(--gf-bg-primary)', border: '1px solid var(--gf-border)', color: 'var(--gf-text-secondary)' }}>
                      Connect
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {connectedApps.includes('strava') && user.strava_athlete && (
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ backgroundColor: 'rgba(252,76,2,0.08)', border: '1px solid rgba(252,76,2,0.2)' }}>
              {user.strava_athlete.profile && (
                <img src={user.strava_athlete.profile} alt="athlete" className="w-10 h-10 rounded-full object-cover" />
              )}
              <div>
                <p className="font-body font-semibold text-sm" style={{ color: '#FC4C02' }}>
                  Connected as {user.strava_athlete.firstname} {user.strava_athlete.lastname}
                </p>
                <p className="font-body text-xs" style={{ color: 'var(--gf-text-secondary)' }}>
                  Activities syncing automatically ✓
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="px-5 pt-5 pb-6">
          {shopError && (
            <div className="mb-3 px-4 py-3 rounded-xl text-sm font-body"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}>
              {shopError}
            </div>
          )}
          <AccessoryShop
            coins={user.coins}
            ownedAccessories={ownedAccessories}
            equippedAccessory={equippedAccessory}
            onBuy={handleBuyAccessory}
            onEquip={handleEquipAccessory}
          />
        </div>
      )}

      {activeTab === 'avatar' && (
        <div className="px-5 pt-6 space-y-6 pb-4">
          {/* Avatar display */}
          {(() => {
            const tierCfg = TIER_CONFIG[currentTier] || TIER_CONFIG[1];
            return (
              <motion.div className="rounded-3xl p-6 flex flex-col items-center relative overflow-hidden"
                style={{ backgroundColor: 'var(--gf-bg-elevated)', border: `1.5px solid ${tierCfg.border}`, background: `linear-gradient(160deg, var(--gf-bg-elevated) 60%, ${tierCfg.bg} 100%)` }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 40%, ${tierCfg.color}, transparent 60%)` }} />

                {/* Tier badge top right */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-xs font-bold"
                  style={{ backgroundColor: `${tierCfg.color}20`, color: tierCfg.color, border: `1px solid ${tierCfg.border}` }}>
                  <span>{TIER_BADGES[currentTier]}</span>
                  <span>{tierCfg.label}</span>
                </div>

                {/* Avatar with gear overlay */}
                <div className="relative z-10 mt-2">
                  <Avatar avatarClass={avatarCfg.class} tier={currentTier}
                    skinTone={avatarCfg.skin_tone} hair={avatarCfg.hair}
                    accessories={equippedAccessory ? [equippedAccessory] : []} size={170} />
                  {equippedItem && (
                    <motion.div className="absolute -top-3 -right-3 text-3xl"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} key={equippedItem.id}
                      transition={{ type: 'spring', stiffness: 300 }}>
                      {equippedItem.emoji}
                    </motion.div>
                  )}
                </div>

                <div className="text-center mt-3 z-10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="px-3 py-1 rounded-full font-heading font-black text-sm"
                      style={{ backgroundColor: tierCfg.color, color: currentTier >= 4 ? '#1A1A1A' : '#0D0F14' }}>
                      LVL {level}
                    </span>
                    <span className="font-heading font-black text-xl" style={{ color: 'var(--gf-text-primary)' }}>{tierCfg.label}</span>
                  </div>
                  {equippedItem && <p className="font-body text-sm" style={{ color: 'var(--gf-amber)' }}>{equippedItem.label}</p>}
                  <p className="font-body text-xs mt-1" style={{ color: tierCfg.color }}>
                    {currentTier === 1 && 'Keep training to unlock your first gear upgrade! ⚔️'}
                    {currentTier === 2 && 'Silver gear unlocked — reach Level 5 for Gold gear 🥇'}
                    {currentTier === 3 && 'Gold gear equipped — Level 7 unlocks Platinum 💠'}
                    {currentTier === 4 && 'Platinum gear equipped — reach Level 10 for Apex 👑'}
                    {currentTier === 5 && 'APEX — maximum evolution reached! 🔥'}
                  </p>
                </div>
              </motion.div>
            );
          })()}

          {/* XP Bar */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--gf-bg-surface)', border: '1px solid var(--gf-border)' }}>
            <div className="flex justify-between font-body text-sm mb-2">
              <span style={{ color: 'var(--gf-text-secondary)' }}>{user.total_xp.toLocaleString()} XP</span>
              <span style={{ color: 'var(--gf-text-secondary)' }}>{nextLevelXP.toLocaleString()} XP</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--gf-border)' }}>
              <motion.div className="h-full rounded-full" style={{ backgroundColor: 'var(--gf-green)' }}
                initial={{ width: 0 }} animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
            <p className="font-body text-xs text-center" style={{ color: 'var(--gf-text-secondary)' }}>
              {xpToNext > 0 ? `${xpToNext.toLocaleString()} XP to next evolution` : 'Max level reached! 🔥'}
            </p>
            <p className="font-body text-[10px] text-center mt-1" style={{ color: 'rgba(200,255,0,0.5)' }}>
              ⚡ XP synced from your real workout logs
            </p>
          </div>

          {/* Customize */}
          <div>
            <h3 className="font-heading font-black text-xl mb-3" style={{ color: 'var(--gf-text-primary)' }}>Customize</h3>

            {/* Class */}
            <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--gf-text-secondary)' }}>Class</p>
            <div className="grid grid-cols-5 gap-2 mb-1">
              {AVATAR_CLASSES.map(cls => {
                const selected = avatarCfg.class === cls;
                const cc = CLASS_COLORS[cls];
                return (
                  <button key={cls} onClick={() => updateAvatar('class', cls)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                    style={{
                      backgroundColor: selected ? `${cc.glow}14` : 'var(--gf-bg-elevated)',
                      border: `1.5px solid ${selected ? cc.glow : 'var(--gf-border)'}`,
                    }}>
                    <Avatar avatarClass={cls} tier={currentTier} skinTone={avatarCfg.skin_tone}
                      hair={avatarCfg.hair} size={36} animate={false} />
                    <span className="font-body text-[10px] font-semibold"
                      style={{ color: selected ? cc.glow : 'var(--gf-text-secondary)' }}>
                      {CLASS_LABELS[cls]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="font-body text-xs mb-4" style={{ color: 'var(--gf-text-secondary)' }}>
              {CLASS_TAGLINES[avatarCfg.class]}
            </p>

            {/* Skin tone */}
            <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--gf-text-secondary)' }}>Skin Tone</p>
            <div className="flex gap-3 mb-4">
              {Object.keys(SKIN_TONES).map(s => (
                <button key={s} onClick={() => updateAvatar('skin_tone', s)}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                  style={{ backgroundColor: SKIN_TONES[s].base, border: `3px solid ${avatarCfg.skin_tone === s ? 'var(--gf-green)' : 'transparent'}` }}>
                  {avatarCfg.skin_tone === s && <Check size={14} color="white" strokeWidth={3} />}
                </button>
              ))}
            </div>

            {/* Hair style */}
            <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--gf-text-secondary)' }}>Hair Style</p>
            <div className="flex gap-2 mb-4">
              {HAIR_STYLES.map(style => {
                const currentStyle = avatarCfg.hair.split('_')[0] || 'short';
                const currentColor = avatarCfg.hair.split('_')[1] || 'black';
                const selected = currentStyle === style;
                return (
                  <button key={style} onClick={() => updateAvatar('hair', `${style}_${currentColor}`)}
                    className="flex-1 py-2.5 rounded-xl font-body font-medium text-xs capitalize transition-all"
                    style={{ backgroundColor: selected ? 'var(--gf-green)' : 'var(--gf-bg-elevated)', color: selected ? '#0D0F14' : 'var(--gf-text-secondary)', border: `1px solid ${selected ? 'var(--gf-green)' : 'var(--gf-border)'}` }}>
                    {style}
                  </button>
                );
              })}
            </div>

            {/* Hair color */}
            <p className="font-body text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--gf-text-secondary)' }}>Hair Color</p>
            <div className="flex gap-3">
              {Object.keys(HAIR_COLORS).map(c => {
                const currentStyle = avatarCfg.hair.split('_')[0] || 'short';
                const selected = (avatarCfg.hair.split('_')[1] || 'black') === c;
                return (
                  <button key={c} onClick={() => updateAvatar('hair', `${currentStyle}_${c}`)}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                    style={{ backgroundColor: HAIR_COLORS[c].base, border: `3px solid ${selected ? 'var(--gf-green)' : 'transparent'}` }}>
                    {selected && <Check size={14} color="white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Analysis */}
          <div>
            <h3 className="font-heading font-black text-xl mb-3" style={{ color: 'var(--gf-text-primary)' }}>Body Analysis</h3>
            <BodyAnalysis workouts={workouts} />
          </div>

          {/* Evolution Path */}
          <div>
            <h3 className="font-heading font-black text-xl mb-3" style={{ color: 'var(--gf-text-primary)' }}>Evolution Path</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {[1,2,3,4,5].map(tier => {
                const unlocked = tier <= currentTier;
                const tc = TIER_CONFIG[tier];
                return (
                  <div key={tier} className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
                    style={{
                      backgroundColor: unlocked ? `${tc.color}10` : 'var(--gf-bg-surface)',
                      border: `1.5px solid ${unlocked ? tc.border : 'var(--gf-border)'}`,
                      opacity: unlocked ? 1 : 0.35,
                      minWidth: 76,
                    }}>
                    <div className="relative">
                      <Avatar avatarClass={avatarCfg.class} tier={tier}
                        skinTone={avatarCfg.skin_tone} hair={avatarCfg.hair}
                        size={44} animate={false} />
                    </div>
                    <span className="text-sm">{TIER_BADGES[tier]}</span>
                    <span className="font-body text-[10px] font-semibold text-center leading-tight"
                      style={{ color: unlocked ? tc.color : 'var(--gf-text-secondary)' }}>
                      {tc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}