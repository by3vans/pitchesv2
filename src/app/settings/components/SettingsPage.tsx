'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/common/Sidebar';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';

interface ProfileForm {
  displayName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationPrefs {
  emailAlerts: boolean;
  pushNotifications: boolean;
  activityDigest: 'off' | 'daily' | 'weekly';
  statusChanges: boolean;
  reconnectionEvents: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  fullKey: string;
  createdAt: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}

type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;
type PasswordErrors = Partial<Record<keyof PasswordForm, string>>;

const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'pm_';
  for (let i = 0; i < 40; i++) key += chars[Math.floor(Math.random() * chars.length)];
  return key;
};

const maskKey = (key: string) => key.slice(0, 7) + '\u2022'.repeat(24) + key.slice(-4);

const formatDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export default function SettingsPage() {
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  // Profile
  const [profile, setProfile] = useState<ProfileForm>({
    displayName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [profileTouched, setProfileTouched] = useState<Partial<Record<keyof ProfileForm, boolean>>>({});
  const [showProfileConfirm, setShowProfileConfirm] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [passwordTouched, setPasswordTouched] = useState<Partial<Record<keyof PasswordForm, boolean>>>({});
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Notification Preferences (local UI state — no DB table)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    emailAlerts: true,
    pushNotifications: false,
    activityDigest: 'daily',
    statusChanges: true,
    reconnectionEvents: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // API Keys (local UI state)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);

  // Danger Zone
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // ── Load profile from Supabase auth ────────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          displayName: user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? '',
          email: user.email ?? '',
          phone: user.user_metadata?.phone ?? '',
          company: user.user_metadata?.company ?? '',
          role: user.user_metadata?.role ?? '',
        });
      }
      setProfileLoading(false);
    };
    loadProfile();
  }, [supabase]);

  // ── Profile validation ──────────────────────────────────────────────────────
  const validateProfileField = (field: keyof ProfileForm, value: string): string => {
    if (field === 'displayName' && !value.trim()) return 'Display name is required';
    if (field === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    }
    if (field === 'phone' && value.trim() && !/^[\+\d\s\(\)\-\.]{7,20}$/.test(value)) {
      return 'Enter a valid phone number';
    }
    return '';
  };

  const handleProfileChange = (field: keyof ProfileForm, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
    if (profileTouched[field]) {
      const err = validateProfileField(field, value);
      setProfileErrors((p) => err ? { ...p, [field]: err } : (({ [field]: _, ...rest }) => rest)(p) as ProfileErrors);
    }
  };

  const handleProfileBlur = (field: keyof ProfileForm, value: string) => {
    setProfileTouched((p) => ({ ...p, [field]: true }));
    const err = validateProfileField(field, value);
    setProfileErrors((p) => err ? { ...p, [field]: err } : (({ [field]: _, ...rest }) => rest)(p) as ProfileErrors);
  };

  const validateProfile = (): boolean => {
    const errs: ProfileErrors = {};
    (['displayName', 'email', 'phone'] as (keyof ProfileForm)[]).forEach((f) => {
      const e = validateProfileField(f, profile[f]);
      if (e) errs[f] = e;
    });
    setProfileErrors(errs);
    setProfileTouched({ displayName: true, email: true, phone: true, company: true, role: true });
    return Object.keys(errs).length === 0;
  };

  const handleProfileSaveRequest = () => {
    if (!validateProfile()) return;
    setShowProfileConfirm(true);
  };

  const handleProfileSaveConfirm = async () => {
    setShowProfileConfirm(false);
    setProfileSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: profile.email,
        data: {
          display_name: profile.displayName,
          phone: profile.phone,
          company: profile.company,
          role: profile.role,
        },
      });
      if (error) throw error;
      showToast('Profile updated successfully', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Password validation ─────────────────────────────────────────────────────
  const validatePasswordField = (field: keyof PasswordForm, value: string, form?: PasswordForm): string => {
    const f = form ?? passwordForm;
    if (field === 'currentPassword' && !value.trim()) return 'Current password is required';
    if (field === 'newPassword') {
      if (!value.trim()) return 'New password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
    }
    if (field === 'confirmPassword') {
      if (!value.trim()) return 'Please confirm your new password';
      if (value !== f.newPassword) return 'Passwords do not match';
    }
    return '';
  };

  const handlePasswordChange = (field: keyof PasswordForm, value: string) => {
    const updated = { ...passwordForm, [field]: value };
    setPasswordForm(updated);
    if (passwordTouched[field]) {
      const err = validatePasswordField(field, value, updated);
      setPasswordErrors((p) => err ? { ...p, [field]: err } : (({ [field]: _, ...rest }) => rest)(p) as PasswordErrors);
    }
    if (field === 'newPassword' && passwordTouched.confirmPassword) {
      const confirmErr = updated.confirmPassword !== value ? 'Passwords do not match' : '';
      setPasswordErrors((p) => confirmErr ? { ...p, confirmPassword: confirmErr } : (({ confirmPassword: _, ...rest }) => rest)(p) as PasswordErrors);
    }
  };

  const handlePasswordBlur = (field: keyof PasswordForm, value: string) => {
    setPasswordTouched((p) => ({ ...p, [field]: true }));
    const err = validatePasswordField(field, value);
    setPasswordErrors((p) => err ? { ...p, [field]: err } : (({ [field]: _, ...rest }) => rest)(p) as PasswordErrors);
  };

  const validatePassword = (): boolean => {
    const errs: PasswordErrors = {};
    (['currentPassword', 'newPassword', 'confirmPassword'] as (keyof PasswordForm)[]).forEach((f) => {
      const e = validatePasswordField(f, passwordForm[f]);
      if (e) errs[f] = e;
    });
    setPasswordErrors(errs);
    setPasswordTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
    return Object.keys(errs).length === 0;
  };

  const handlePasswordSaveRequest = () => {
    if (!validatePassword()) return;
    setShowPasswordConfirm(true);
  };

  const handlePasswordSaveConfirm = async () => {
    setShowPasswordConfirm(false);
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordTouched({});
      setPasswordErrors({});
      showToast('Password updated successfully', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update password', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Notification handlers (local UI only) ──────────────────────────────────
  const handleNotifToggle = (key: keyof Pick<NotificationPrefs, 'emailAlerts' | 'pushNotifications' | 'statusChanges' | 'reconnectionEvents'>) => {
    setNotifPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleNotifSave = () => {
    setNotifSaving(true);
    setTimeout(() => {
      setNotifSaving(false);
      showToast('Notification preferences saved', 'success');
    }, 400);
  };

  // ── API Key handlers (local UI only) ───────────────────────────────────────
  const handleCopyKey = (key: ApiKey) => {
    navigator.clipboard.writeText(key.fullKey).then(() => {
      setCopiedKey(key.id);
      showToast('API key copied to clipboard', 'success');
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleRevealKey = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRevokeKey = () => {
    if (!revokeTarget) return;
    setApiKeys((keys) => keys.map((k) => k.id === revokeTarget.id ? { ...k, status: 'revoked' as const } : k));
    setRevokeTarget(null);
    showToast('API key revoked', 'info');
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) { showToast('Please enter a key name', 'error'); return; }
    setGeneratingKey(true);
    setTimeout(() => {
      const fullKey = generateKey();
      const newKey: ApiKey = {
        id: `key-${Date.now()}`,
        name: newKeyName.trim(),
        maskedKey: maskKey(fullKey),
        fullKey,
        createdAt: formatDate(new Date()),
        lastUsed: 'Never',
        status: 'active',
      };
      setApiKeys((prev) => [...prev, newKey]);
      setRevealedKeys((prev) => new Set([...prev, newKey.id]));
      setNewKeyName('');
      setShowNewKeyForm(false);
      setGeneratingKey(false);
      showToast('New API key generated', 'success');
    }, 700);
  };

  // ── Danger Zone — delete all user data from Supabase ───────────────────────
  const handleClearData = async () => {
    setShowClearConfirm(false);
    setClearing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await Promise.all([
        supabase.from('pitches').delete().eq('user_id', user.id),
        supabase.from('artists').delete().eq('user_id', user.id),
        supabase.from('contacts').delete().eq('user_id', user.id),
        supabase.from('reminders').delete().eq('user_id', user.id),
      ]);

      showToast('All data deleted from your account', 'info');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to clear data', 'error');
    } finally {
      setClearing(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `pm-input focus:ring-2 focus:ring-blue-500 focus:outline-none${hasError ? ' border-red-400 bg-red-50 focus:ring-red-300' : ''}`;

  const Toggle = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      type="button"
      className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shrink-0"
      style={{ background: checked ? 'var(--color-accent)' : 'var(--color-border)', border: '1px solid transparent' }}>
      <span
        className="inline-block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  );

  const activeKeys = apiKeys.filter((k) => k.status === 'active');
  const revokedKeys = apiKeys.filter((k) => k.status === 'revoked');

  const pwStrength = (pw: string): number => {
    if (!pw) return 0;
    if (pw.length < 8) return 1;
    if (pw.length >= 12 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) return 4;
    if (pw.length >= 10 && /[A-Z]/.test(pw)) return 3;
    return 2;
  };

  const pwStrengthLabel = ['', 'Weak — add more characters', 'Fair — try uppercase or numbers', 'Good — add symbols for stronger security', 'Strong password'];
  const pwStrengthColor = ['', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

  const isSaving = profileSaving || passwordSaving || notifSaving || clearing;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />

      {/* Saving overlay */}
      {isSaving && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          aria-busy="true"
          aria-label="Saving settings, please wait">
          <div
            className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl shadow-2xl"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="var(--color-border)" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>
              {profileSaving ? 'Saving profile…' : passwordSaving ? 'Updating password…' : clearing ? 'Deleting data…' : 'Saving preferences…'}
            </p>
          </div>
        </div>
      )}

      <main className="pt-16 md:pt-0 md:pl-56">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Header */}
          <div className="pm-panel">
            <p className="pm-kicker">Preferences</p>
            <h1 className="pm-h1">Settings</h1>
          </div>

          {/* Profile Section */}
          <div className="pm-panel">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="UserCircleIcon" size={18} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
              <div>
                <p className="pm-kicker mb-0">Account</p>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Profile Information</h2>
              </div>
            </div>

            {profileLoading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}
              </div>
            ) : (
              <div
                className="space-y-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                    e.preventDefault();
                    handleProfileSaveRequest();
                  }
                }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="pm-label">Display Name <span className="text-red-500">*</span></label>
                    <input
                      className={inputClass(!!profileErrors.displayName)}
                      value={profile.displayName}
                      onChange={(e) => handleProfileChange('displayName', e.target.value)}
                      onBlur={(e) => handleProfileBlur('displayName', e.target.value)}
                      placeholder="Your display name"
                      tabIndex={1}
                      aria-required="true"
                      aria-describedby={profileErrors.displayName ? 'profile-displayName-error' : undefined} />
                    {profileErrors.displayName && (
                      <p id="profile-displayName-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <Icon name="ExclamationCircleIcon" size={12} variant="outline" />{profileErrors.displayName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="pm-label">Email <span className="text-red-500">*</span></label>
                    <input
                      className={inputClass(!!profileErrors.email)}
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      onBlur={(e) => handleProfileBlur('email', e.target.value)}
                      placeholder="your@email.com"
                      tabIndex={2}
                      aria-required="true"
                      aria-describedby={profileErrors.email ? 'profile-email-error' : undefined} />
                    {profileErrors.email && (
                      <p id="profile-email-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <Icon name="ExclamationCircleIcon" size={12} variant="outline" />{profileErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="pm-label">Phone</label>
                    <input
                      className={inputClass(!!profileErrors.phone)}
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      onBlur={(e) => handleProfileBlur('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      tabIndex={3}
                      aria-describedby={profileErrors.phone ? 'profile-phone-error' : undefined} />
                    {profileErrors.phone && (
                      <p id="profile-phone-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <Icon name="ExclamationCircleIcon" size={12} variant="outline" />{profileErrors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="pm-label">Company</label>
                    <input className={inputClass(false)} value={profile.company} onChange={(e) => handleProfileChange('company', e.target.value)} placeholder="Your company" tabIndex={4} />
                  </div>
                  <div>
                    <label className="pm-label">Role</label>
                    <input className={inputClass(false)} value={profile.role} onChange={(e) => handleProfileChange('role', e.target.value)} placeholder="e.g. A&R Manager" tabIndex={5} />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button type="button" onClick={handleProfileSaveRequest} disabled={profileSaving} className="pm-btn-primary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none" tabIndex={6}>
                    {profileSaving ? <><Icon name="ArrowPathIcon" size={15} variant="outline" className="animate-spin" />Saving&hellip;</> : <><Icon name="CheckIcon" size={15} variant="solid" />Save Profile</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="pm-panel">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="LockClosedIcon" size={18} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
              <div>
                <p className="pm-kicker mb-0">Security</p>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Change Password</h2>
              </div>
            </div>

            <div className="space-y-4" onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); handlePasswordSaveRequest(); } }}>
              {/* Current Password */}
              <div>
                <label className="pm-label">Current Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input className={inputClass(!!passwordErrors.currentPassword)} type={showCurrentPw ? 'text' : 'password'} value={passwordForm.currentPassword} onChange={(e) => handlePasswordChange('currentPassword', e.target.value)} onBlur={(e) => handlePasswordBlur('currentPassword', e.target.value)} placeholder="Enter current password" tabIndex={7} aria-required="true" style={{ paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded" style={{ color: 'var(--color-muted-foreground)' }} aria-label={showCurrentPw ? 'Hide password' : 'Show password'} tabIndex={-1}>
                    <Icon name={showCurrentPw ? 'EyeSlashIcon' : 'EyeIcon'} size={15} variant="outline" />
                  </button>
                </div>
                {passwordErrors.currentPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} variant="outline" />{passwordErrors.currentPassword}</p>}
              </div>

              {/* New Password */}
              <div>
                <label className="pm-label">New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input className={inputClass(!!passwordErrors.newPassword)} type={showNewPw ? 'text' : 'password'} value={passwordForm.newPassword} onChange={(e) => handlePasswordChange('newPassword', e.target.value)} onBlur={(e) => handlePasswordBlur('newPassword', e.target.value)} placeholder="Min. 8 characters" tabIndex={8} aria-required="true" style={{ paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded" style={{ color: 'var(--color-muted-foreground)' }} tabIndex={-1}>
                    <Icon name={showNewPw ? 'EyeSlashIcon' : 'EyeIcon'} size={15} variant="outline" />
                  </button>
                </div>
                {passwordErrors.newPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} variant="outline" />{passwordErrors.newPassword}</p>}
                {passwordForm.newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => {
                        const strength = pwStrength(passwordForm.newPassword);
                        return <div key={level} className="h-1 flex-1 rounded-full transition-colors duration-200" style={{ background: level <= strength ? pwStrengthColor[strength] : 'var(--color-border)' }} />;
                      })}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{pwStrengthLabel[pwStrength(passwordForm.newPassword)]}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="pm-label">Confirm New Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input className={inputClass(!!passwordErrors.confirmPassword)} type={showConfirmPw ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)} onBlur={(e) => handlePasswordBlur('confirmPassword', e.target.value)} placeholder="Re-enter new password" tabIndex={9} aria-required="true" style={{ paddingRight: '2.5rem' }} />
                  <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded" style={{ color: 'var(--color-muted-foreground)' }} tabIndex={-1}>
                    <Icon name={showConfirmPw ? 'EyeSlashIcon' : 'EyeIcon'} size={15} variant="outline" />
                  </button>
                </div>
                {passwordErrors.confirmPassword && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Icon name="ExclamationCircleIcon" size={12} variant="outline" />{passwordErrors.confirmPassword}</p>}
              </div>

              <div className="flex justify-end pt-1">
                <button type="button" onClick={handlePasswordSaveRequest} disabled={passwordSaving} className="pm-btn-primary focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none" tabIndex={10}>
                  {passwordSaving ? <><Icon name="ArrowPathIcon" size={15} variant="outline" className="animate-spin" />Updating&hellip;</> : <><Icon name="LockClosedIcon" size={15} variant="outline" />Update Password</>}
                </button>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="pm-panel">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="BellIcon" size={18} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
              <div>
                <p className="pm-kicker mb-0">Alerts</p>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Notification Preferences</h2>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {([
                { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive pitch and artist updates via email', id: 'toggle-email' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push alerts for real-time events', id: 'toggle-push' },
                { key: 'statusChanges', label: 'Status Change Alerts', desc: 'Notify when pitch status changes', id: 'toggle-status' },
                { key: 'reconnectionEvents', label: 'Reconnection Events', desc: 'Alert when offline queue syncs after reconnecting', id: 'toggle-reconnect' },
              ] as const).map(({ key, label, desc, id }) => (
                <div key={key} className="flex items-center justify-between py-3">
                  <div>
                    <label htmlFor={id} className="text-sm font-medium cursor-pointer" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>{label}</label>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{desc}</p>
                  </div>
                  <Toggle id={id} checked={notifPrefs[key]} onChange={() => handleNotifToggle(key)} />
                </div>
              ))}
              <div className="flex items-start justify-between py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Activity Digest</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Summary of all activity sent to your email</p>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  {(['off', 'daily', 'weekly'] as const).map((opt) => (
                    <button key={opt} type="button" onClick={() => setNotifPrefs((p) => ({ ...p, activityDigest: opt }))} className="px-3 py-1 text-xs font-medium rounded-lg transition-all duration-150 capitalize"
                      style={{ background: notifPrefs.activityDigest === opt ? 'var(--color-primary)' : 'var(--color-muted)', color: notifPrefs.activityDigest === opt ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-3">
              <button type="button" onClick={handleNotifSave} disabled={notifSaving} className="pm-btn-primary">
                <Icon name="CheckIcon" size={15} variant="solid" />Save Preferences
              </button>
            </div>
          </div>

          {/* API Key Management */}
          <div className="pm-panel">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon name="KeyIcon" size={18} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
                <div>
                  <p className="pm-kicker mb-0">Developer</p>
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>API Key Management</h2>
                </div>
              </div>
              <button type="button" onClick={() => setShowNewKeyForm((v) => !v)} className="pm-btn flex items-center gap-1.5" style={{ color: 'var(--color-foreground)', borderColor: 'var(--color-border)' }}>
                <Icon name="PlusIcon" size={14} variant="outline" />New Key
              </button>
            </div>
            {showNewKeyForm && (
              <div className="mb-4 p-3 rounded-xl flex flex-col sm:flex-row gap-3" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                <input className="pm-input flex-1" placeholder="Key name (e.g. Staging Key)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerateKey()} autoFocus />
                <div className="flex gap-2">
                  <button type="button" onClick={handleGenerateKey} disabled={generatingKey} className="pm-btn-primary" style={{ opacity: generatingKey ? 0.6 : 1 }}>
                    {generatingKey ? <><Icon name="ArrowPathIcon" size={14} variant="outline" className="animate-spin" />Generating&hellip;</> : <><Icon name="SparklesIcon" size={14} variant="outline" />Generate</>}
                  </button>
                  <button type="button" onClick={() => { setShowNewKeyForm(false); setNewKeyName(''); }} className="pm-btn">Cancel</button>
                </div>
              </div>
            )}
            {activeKeys.length > 0 && (
              <div className="space-y-3">
                {activeKeys.map((key) => (
                  <div key={key.id} className="p-3 rounded-xl" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>{key.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>Created {key.createdAt} · Last used {key.lastUsed}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: '#d1fae5', color: '#065f46' }}>Active</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2 font-mono text-xs overflow-x-auto" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}>
                      <span className="flex-1 truncate">{revealedKeys.has(key.id) ? key.fullKey : key.maskedKey}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => handleRevealKey(key.id)} className="pm-btn text-xs py-1 px-2.5">
                        <Icon name={revealedKeys.has(key.id) ? 'EyeSlashIcon' : 'EyeIcon'} size={13} variant="outline" />{revealedKeys.has(key.id) ? 'Hide' : 'Reveal'}
                      </button>
                      <button type="button" onClick={() => handleCopyKey(key)} className="pm-btn text-xs py-1 px-2.5">
                        <Icon name={copiedKey === key.id ? 'CheckIcon' : 'ClipboardDocumentIcon'} size={13} variant="outline" />{copiedKey === key.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button type="button" onClick={() => setRevokeTarget(key)} className="pm-btn text-xs py-1 px-2.5 ml-auto" style={{ color: 'var(--color-destructive)', borderColor: 'rgba(239,68,68,0.3)' }}>
                        <Icon name="XCircleIcon" size={13} variant="outline" />Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {revokedKeys.length > 0 && (
              <div className="mt-4">
                <p className="pm-kicker mb-2">Revoked Keys</p>
                <div className="space-y-2">
                  {revokedKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 rounded-xl opacity-60" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>{key.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Revoked · Created {key.createdAt}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#991b1b' }}>Revoked</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeKeys.length === 0 && !showNewKeyForm && (
              <div className="text-center py-8">
                <Icon name="KeyIcon" size={32} variant="outline" style={{ color: 'var(--color-muted-foreground)', margin: '0 auto 8px' }} />
                <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No active API keys. Generate one to get started.</p>
              </div>
            )}
          </div>

          {/* Data Storage */}
          <div className="pm-panel">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="CircleStackIcon" size={18} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
              <div>
                <p className="pm-kicker mb-0">Storage</p>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Data Storage</h2>
              </div>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
              All data is stored securely in Supabase. Your pitches, artists, contacts, and reminders are synced in real time.
            </p>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
              <Icon name="CircleStackIcon" size={18} variant="outline" style={{ color: 'var(--color-muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>Supabase (PostgreSQL)</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: '#d1fae5', color: '#065f46' }}>Connected</span>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pm-panel" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="ExclamationTriangleIcon" size={18} variant="outline" style={{ color: 'var(--color-destructive)' }} />
              <div>
                <p className="pm-kicker mb-0" style={{ color: 'var(--color-destructive)' }}>Danger Zone</p>
                <h2 className="font-semibold text-sm" style={{ color: 'var(--color-foreground)', fontFamily: 'Inter, sans-serif' }}>Destructive Actions</h2>
              </div>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--color-muted-foreground)' }}>
              Permanently delete all your data from the database — pitches, artists, contacts, and reminders. This cannot be undone.
            </p>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={clearing}
              className="pm-btn flex items-center gap-2 focus:ring-2 focus:ring-red-400 focus:outline-none"
              style={{ color: 'var(--color-destructive)', border: '1px solid var(--color-destructive)' }}>
              <Icon name="TrashIcon" size={15} variant="outline" />
              {clearing ? 'Deleting…' : 'Delete All Data'}
            </button>
          </div>

        </div>
      </main>

      {showProfileConfirm && (
        <ConfirmModal title="Save Profile Changes" message="Save your updated profile information? Your display name, email, and phone will be updated." confirmLabel="Save Changes" onConfirm={handleProfileSaveConfirm} onCancel={() => setShowProfileConfirm(false)} />
      )}
      {showPasswordConfirm && (
        <ConfirmModal title="Update Password" message="Are you sure you want to update your password? You will need to use the new password on your next login." confirmLabel="Update Password" onConfirm={handlePasswordSaveConfirm} onCancel={() => setShowPasswordConfirm(false)} />
      )}
      {revokeTarget && (
        <ConfirmModal title="Revoke API Key" message={`Revoke "${revokeTarget.name}"? Any applications using this key will lose access immediately.`} confirmLabel="Revoke Key" onConfirm={handleRevokeKey} onCancel={() => setRevokeTarget(null)} />
      )}
      {showClearConfirm && (
        <ConfirmModal title="Delete All Data" message="This cannot be undone. All pitches, artists, contacts, and reminders will be permanently deleted from your account." confirmLabel="Delete All Data" onConfirm={handleClearData} onCancel={() => setShowClearConfirm(false)} />
      )}
    </div>
  );
}