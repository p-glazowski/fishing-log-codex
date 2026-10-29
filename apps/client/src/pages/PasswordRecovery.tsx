import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { forgotPasswordSchema, resetPasswordSchema } from '@lurelog/shared';
import { Logo } from '../components/branding/Logo';
import { LanguageSelect } from '../components/settings/LanguageSettings';
import { AuthTextField } from '../components/forms/AuthTextField';
import { PasswordField } from '../components/forms/PasswordField';
import { Button } from '../components/ui/button';
import { data, json, errorMessage } from '../lib/api';
import { useTranslation } from '../lib/i18n';

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [done, setDone] = useState(false);
  const form = useForm<{ email: string; password: string }>({
    defaultValues: { email: '', password: '' },
  });
  const [error, setError] = useState('');
  const token = location.hash.slice(1);
  async function submit(values: { email: string; password: string }) {
    setError('');
    const schema = reset ? resetPasswordSchema : forgotPasswordSchema;
    const result = schema.safeParse(
      reset ? { token, password: values.password } : { email: values.email },
    );
    if (!result.success) {
      for (const issue of result.error.issues) {
        if (issue.path[0] === 'email' || issue.path[0] === 'password')
          form.setError(issue.path[0], { message: issue.message });
        else setError('This reset link is invalid or has expired.');
      }
      return;
    }
    try {
      await data(`/auth/${reset ? 'reset-password' : 'forgot-password'}`, {
        method: 'POST',
        body: json(result.data),
      });
      setDone(true);
      if (reset) window.history.replaceState(null, '', location.pathname);
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <header className="auth-header">
          <Logo />
          <Link className="back-link" to="/login">
            {t('← Back to sign in')}
          </Link>
        </header>
        <div className="auth-form-wrap">
          <h1>{t(reset ? 'Choose a new password.' : 'Forgot your password?')}</h1>
          {done ? (
            <p role="status">
              {t(
                reset
                  ? 'Your password has been reset. Please sign in.'
                  : 'If an account exists for that email, a reset link has been sent.',
              )}
            </p>
          ) : (
            <>
              <p>
                {t(
                  reset
                    ? 'Enter a new password for your account.'
                    : 'Enter your email and we’ll send you a reset link.',
                )}
              </p>
              <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(submit)} noValidate>
                  {reset ? (
                    <PasswordField
                      label={t('New password')}
                      registration={form.register('password')}
                      error={form.formState.errors.password?.message}
                      autoComplete="new-password"
                      placeholder={t('At least 12 characters')}
                    />
                  ) : (
                    <AuthTextField
                      name="email"
                      label={t('Email address')}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  )}
                  {error && (
                    <p role="alert" className="error-banner">
                      {t(error)}
                    </p>
                  )}
                  <Button className="full-width" disabled={form.formState.isSubmitting}>
                    {t(
                      form.formState.isSubmitting
                        ? 'One moment…'
                        : reset
                          ? 'Reset password'
                          : 'Send reset link',
                    )}
                  </Button>
                </form>
              </FormProvider>
            </>
          )}
          <p className="auth-switch">
            <Link to="/login">{t('Sign in')}</Link>
            {reset && !done && (
              <>
                {' '}
                · <Link to="/forgot-password">{t('Request a new link')}</Link>
              </>
            )}
          </p>
        </div>
        <LanguageSelect />
      </div>
    </div>
  );
}
