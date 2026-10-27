import { t, useTranslation, validationMessage } from '../lib/i18n';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, passwordSchema } from '@lurelog/shared';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserRound, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { data, json, errorMessage, upload } from '../lib/api';
import { PageHeading, ImageUpload } from '../components/common';
import { Button } from '../components/ui/button';
import { LanguageSettings } from '../components/settings/LanguageSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
export default function Profile() {
  useTranslation();

  const { user, refresh } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const profile = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name, email: user?.email },
  });
  const password = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });
  async function saveProfile(values: z.infer<typeof profileSchema>) {
    try {
      await data('/users/me', { method: 'PATCH', body: json(values) });
      await refresh();
      toast.success(t('Profile updated'));
    } catch (e) {
      profile.setError('root', { message: errorMessage(e) });
    }
  }
  async function changePassword(values: z.infer<typeof passwordSchema>) {
    try {
      await data('/auth/password', { method: 'PATCH', body: json(values) });
      password.reset();
      toast.success(t('Password changed. Other sessions have been signed out.'));
    } catch (e) {
      password.setError('root', { message: errorMessage(e) });
    }
  }
  async function saveAvatar() {
    if (!file) return;
    setImageBusy(true);
    try {
      await upload('/users/me/avatar', file);
      await refresh();
      setFile(null);
      toast.success(t('Avatar updated'));
    } catch (e) {
      toast.error(t(errorMessage(e)));
    } finally {
      setImageBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={t('YOUR PERSONAL SPACE')}
        title={t('Account settings')}
        description={t('A few details about the angler behind the stories.')}
      />
      <div className="account-identity">
        <span className="avatar">
          {user?.avatar ? <img src={user.avatar.url} alt="" /> : user?.name.slice(0, 1)}
        </span>
        <div>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </div>
        <span className="account-private">
          <ShieldCheck size={16} />
          {t('Private workspace')}
        </span>
      </div>
      <div className="profile-grid">
        <section className="panel form-section">
          <div className="form-section-heading">
            <UserRound />
            <div>
              <h2>{t('Your profile')}</h2>
              <p>{t('Make yourself at home.')}</p>
            </div>
          </div>
          <form noValidate onSubmit={profile.handleSubmit(saveProfile)}>
            <label>
              {t('Your name')}
              <input {...profile.register('name')} autoComplete="name" />
              <span className="field-error">
                {validationMessage(profile.formState.errors.name?.message)}
              </span>
            </label>
            <label>
              {t('Email address')}
              <input {...profile.register('email')} type="email" autoComplete="email" />
              <span className="field-error">
                {validationMessage(profile.formState.errors.email?.message)}
              </span>
            </label>
            {profile.formState.errors.root && (
              <p role="alert" className="error-banner">
                {t(profile.formState.errors.root.message)}
              </p>
            )}
            <Button disabled={profile.formState.isSubmitting}>
              <Check size={17} />
              {t('Save profile')}
            </Button>
          </form>
        </section>
        <section className="panel form-section">
          <h2>{t('Your avatar')}</h2>
          <p className="muted">{t('Put a face to your fishing story.')}</p>
          <ImageUpload file={file} onChange={setFile} existing={user?.avatar?.url} />
          {file && (
            <Button onClick={saveAvatar} disabled={imageBusy}>
              {imageBusy ? t('Uploading…') : t('Save avatar')}
            </Button>
          )}
        </section>
        <AppearanceSettings />
        <LanguageSettings />
        <section className="panel form-section">
          <div className="form-section-heading">
            <ShieldCheck />
            <div>
              <h2>{t('Keep your account secure')}</h2>
              <p>{t('Changing your password signs out other sessions.')}</p>
            </div>
          </div>
          <form noValidate onSubmit={password.handleSubmit(changePassword)}>
            <label>
              {t('Current password')}
              <input
                type="password"
                autoComplete="current-password"
                {...password.register('currentPassword')}
              />
              <span className="field-error">
                {validationMessage(password.formState.errors.currentPassword?.message)}
              </span>
            </label>
            <label>
              {t('New password')}
              <input
                type="password"
                autoComplete="new-password"
                placeholder={t('At least 12 characters')}
                {...password.register('newPassword')}
              />
              <span className="field-error">
                {validationMessage(password.formState.errors.newPassword?.message)}
              </span>
            </label>
            {password.formState.errors.root && (
              <p role="alert" className="error-banner">
                {t(password.formState.errors.root.message)}
              </p>
            )}
            <Button disabled={password.formState.isSubmitting}>{t('Update password')}</Button>
          </form>
        </section>
        <div className="profile-note">
          <ShieldCheck size={30} />
          <h2>{t('Your collection. Your memories.')}</h2>
          <p>
            {t(
              'Your lures, catches, and photos are visible only to you. LureLog keeps every story in your personal fishing space.',
            )}
          </p>
        </div>
      </div>
    </>
  );
}
