import React from 'react';
import Avatar from './Avatar';
import { normalizeAvatarConfig } from './migrate';

/**
 * Convenience wrapper: render a user object's avatar. Accepts any historical
 * avatar_config shape and the user's equipped shop accessory.
 */
export default function UserAvatar({ user, tier, size = 120, animate = true, className = '', style }) {
  const cfg = normalizeAvatarConfig(user?.avatar_config);
  return (
    <Avatar
      avatarClass={cfg.class}
      tier={tier ?? user?.avatar_tier ?? 1}
      skinTone={cfg.skin_tone}
      hair={cfg.hair}
      accessories={user?.equipped_accessory ? [user.equipped_accessory] : []}
      size={size}
      animate={animate}
      className={className}
      style={style}
    />
  );
}
