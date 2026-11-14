import React from 'react';
import AthleteAvatar from './AthleteAvatar';
import { normalizeAvatarConfig } from './migrate';
import { athleteForConfig } from './athletes';

/**
 * Convenience wrapper: render a user object's athlete. Accepts any historical
 * avatar_config shape; a profile that never picked an athlete shows the one
 * matching its stored class and body.
 *
 * `moment` and `resting` choose the picture (see athletePose). The drawn SVG
 * rig's props (`animate`, `revealFromTier`) are accepted and ignored so older
 * call sites keep working.
 */
export default function UserAvatar({
  user, tier, size = 120, className = '', style,
  interactive = false, onActivate, moment = null, resting = false,
  variant = 'auto', priority = false,
}) {
  const cfg = normalizeAvatarConfig(user?.avatar_config, { gender: user?.gender });
  const athlete = athleteForConfig(cfg);
  return (
    <AthleteAvatar
      athleteId={athlete.id}
      tier={tier ?? user?.avatar_tier ?? 1}
      moment={moment}
      resting={resting}
      size={size}
      variant={variant}
      interactive={interactive}
      onActivate={onActivate}
      priority={priority}
      className={className}
      style={style}
    />
  );
}
