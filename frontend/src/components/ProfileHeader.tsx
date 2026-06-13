import { useEffect, useState, type ReactNode } from 'react';
import { resolveMediaUrl } from '../lib/api';
import type { User } from '../types';

type ProfileStat = {
  label: string;
  value: number;
};

type ProfileHeaderProps = {
  profile: User;
  stats: ProfileStat[];
  actions?: ReactNode;
  coverAction?: ReactNode;
  avatarAction?: ReactNode;
};

export default function ProfileHeader({ profile, stats, actions, coverAction, avatarAction }: ProfileHeaderProps) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => setAvatarFailed(false), [profile.avatar]);
  useEffect(() => setCoverFailed(false), [profile.cover]);

  const avatarUrl = profile.avatar?.trim();
  const coverUrl = profile.cover?.trim();
  const initial = (profile.fullName?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <>
      <div className="profile-cover shared-profile-cover">
        {coverUrl && !coverFailed ? (
          <img src={resolveMediaUrl(coverUrl)} alt={`Ảnh bìa của ${profile.fullName}`} onError={() => setCoverFailed(true)} />
        ) : (
          <div className="shared-profile-cover-fallback"><span>{profile.fullName}</span></div>
        )}
        {coverAction && <div className="shared-profile-cover-action">{coverAction}</div>}
      </div>

      <div className="profile-header shared-profile-header">
        <div className="profile-avatar-large">
          {avatarUrl && !avatarFailed ? (
            <img src={resolveMediaUrl(avatarUrl)} alt={profile.fullName} onError={() => setAvatarFailed(true)} />
          ) : (
            <div className="profile-avatar-placeholder">{initial}</div>
          )}
          {avatarAction}
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{profile.fullName}</h1>
          <p className="profile-bio">{profile.bio || 'Chưa có giới thiệu.'}</p>
          <div className="profile-stats">
            {stats.map((stat) => (
              <div className="profile-stat" key={stat.label}>
                <div className="profile-stat-value">{stat.value}</div>
                <div className="profile-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        {actions && <div className="profile-actions">{actions}</div>}
      </div>
    </>
  );
}
