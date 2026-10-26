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
export default function Profile() {
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
      toast.success('Profile updated');
    } catch (e) {
      profile.setError('root', { message: errorMessage(e) });
    }
  }
  async function changePassword(values: z.infer<typeof passwordSchema>) {
    try {
      await data('/auth/password', { method: 'PATCH', body: json(values) });
      password.reset();
      toast.success('Password changed. Other sessions have been signed out.');
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
      toast.success('Avatar updated');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setImageBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL SPACE"
        title="Account settings"
        description="A few details about the angler behind the stories."
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
          Private workspace
        </span>
      </div>
      <div className="profile-grid">
        <section className="panel form-section">
          <div className="form-section-heading">
            <UserRound />
            <div>
              <h2>Your profile</h2>
              <p>Make yourself at home.</p>
            </div>
          </div>
          <form noValidate onSubmit={profile.handleSubmit(saveProfile)}>
            <label>
              Your name
              <input {...profile.register('name')} autoComplete="name" />
              <span className="field-error">{profile.formState.errors.name?.message}</span>
            </label>
            <label>
              Email address
              <input {...profile.register('email')} type="email" autoComplete="email" />
              <span className="field-error">{profile.formState.errors.email?.message}</span>
            </label>
            {profile.formState.errors.root && (
              <p role="alert" className="error-banner">
                {profile.formState.errors.root.message}
              </p>
            )}
            <Button disabled={profile.formState.isSubmitting}>
              <Check size={17} />
              Save profile
            </Button>
          </form>
        </section>
        <section className="panel form-section">
          <h2>Your avatar</h2>
          <p className="muted">Put a face to your fishing story.</p>
          <ImageUpload file={file} onChange={setFile} existing={user?.avatar?.url} />
          {file && (
            <Button onClick={saveAvatar} disabled={imageBusy}>
              {imageBusy ? 'Uploading…' : 'Save avatar'}
            </Button>
          )}
        </section>
        <section className="panel form-section">
          <div className="form-section-heading">
            <ShieldCheck />
            <div>
              <h2>Keep your account secure</h2>
              <p>Changing your password signs out other sessions.</p>
            </div>
          </div>
          <form noValidate onSubmit={password.handleSubmit(changePassword)}>
            <label>
              Current password
              <input
                type="password"
                autoComplete="current-password"
                {...password.register('currentPassword')}
              />
              <span className="field-error">
                {password.formState.errors.currentPassword?.message}
              </span>
            </label>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                placeholder="At least 12 characters"
                {...password.register('newPassword')}
              />
              <span className="field-error">{password.formState.errors.newPassword?.message}</span>
            </label>
            {password.formState.errors.root && (
              <p role="alert" className="error-banner">
                {password.formState.errors.root.message}
              </p>
            )}
            <Button disabled={password.formState.isSubmitting}>Update password</Button>
          </form>
        </section>
        <div className="profile-note">
          <ShieldCheck size={30} />
          <h2>Your collection. Your memories.</h2>
          <p>
            Your lures, catches, and photos are visible only to you. LureLog keeps every story in
            your personal fishing space.
          </p>
        </div>
      </div>
    </>
  );
}
