import { LanguageSelect } from '../components/settings/LanguageSettings';
import { t, useTranslation, validationMessage } from '../lib/i18n';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema, loginSchema } from '@lurelog/shared';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { data, json, errorMessage } from '../lib/api';
import { Logo } from '../components/branding/Logo';
import { Button } from '../components/ui/button';
export default function Auth({ register = false }: { register?: boolean }) {
  useTranslation();

  const schema = register ? registerSchema : loginSchema;
  type Values = z.infer<typeof registerSchema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema) as unknown as import('react-hook-form').Resolver<Values>,
  });
  const navigate = useNavigate();
  const client = useQueryClient();
  const { user: sessionUser } = useAuth();
  useEffect(() => {
    if (sessionUser) navigate('/dashboard', { replace: true });
  }, [sessionUser, navigate]);
  async function submit(values: Values) {
    try {
      const user = await data(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body: json(values),
      });
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
      client.setQueryData(['session'], user);
    } catch (e) {
      form.setError('root', { message: errorMessage(e) });
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <header className="auth-header">
          <Logo />
          <Link className="back-link" to="/">
            {t('← Back to LureLog')}
          </Link>
        </header>
        <div className="auth-form-wrap">
          <h1>{register ? t('Start your fishing story.') : t('Welcome back, angler.')}</h1>
          <p>
            {register
              ? t('A little organization. A lot more adventure.')
              : t('Your collection and your memories are waiting.')}
          </p>
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            {register && (
              <label>
                {t('Your name')}
                <input autoComplete="name" placeholder="Alex Fisher" {...form.register('name')} />
                <span className="field-error">
                  {validationMessage(form.formState.errors.name?.message)}
                </span>
              </label>
            )}
            <label>
              {t('Email address')}
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...form.register('email')}
              />
              <span className="field-error">
                {validationMessage(form.formState.errors.email?.message)}
              </span>
            </label>
            <label>
              {t('Password')}
              <input
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder={register ? t('At least 12 characters') : t('Your password')}
                {...form.register('password')}
              />
              <span className="field-error">
                {validationMessage(form.formState.errors.password?.message)}
              </span>
            </label>
            {form.formState.errors.root && (
              <p role="alert" className="error-banner">
                {t(form.formState.errors.root.message)}
              </p>
            )}
            <Button className="full-width" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? t('One moment…')
                : register
                  ? t('Create your free account')
                  : t('Sign in')}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? t('Already have an account?') : t('New around here?')}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? t('Sign in') : t('Create an account')}
            </Link>
          </p>
          <div className="privacy-note">
            <ShieldCheck size={16} />
            {t('Your collection is private. Always yours.')}
          </div>
        </div>
        <LanguageSelect />
      </div>
    </div>
  );
}
