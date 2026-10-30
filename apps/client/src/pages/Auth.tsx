import { LanguageSelect } from '../components/settings/LanguageSettings';
import { t, useTranslation } from '../lib/i18n';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema, loginSchema } from '@lurelog/shared';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { data, json, errorMessage } from '../lib/api';
import { Logo } from '../components/branding/Logo';
import { Button } from '../components/ui/button';
import { AuthTextField } from '../components/forms/AuthTextField';
import { PasswordField } from '../components/forms/PasswordField';
import { returnPath } from '../lib/navigation';
export default function Auth({ register = false }: { register?: boolean }) {
  return <AuthScreen key={register ? 'register' : 'login'} register={register} />;
}
function AuthScreen({ register }: { register: boolean }) {
  useTranslation();

  const schema = register ? registerSchema : loginSchema;
  type Values = z.infer<typeof registerSchema>;
  const form = useForm<Values>({
    shouldFocusError: false,
    defaultValues: register ? { name: '', email: '', password: '' } : { email: '', password: '' },
    resolver: zodResolver(schema) as unknown as import('react-hook-form').Resolver<Values>,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const client = useQueryClient();
  const { user: sessionUser } = useAuth();
  useEffect(() => {
    if (sessionUser)
      navigate(returnPath({ returnTo: location.state?.from }, '/dashboard'), { replace: true });
  }, [sessionUser, navigate, location.state]);
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
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(submit, (errors) => {
                for (const name of ['name', 'email', 'password'] as const) {
                  if (errors[name]) {
                    form.setFocus(name);
                    break;
                  }
                }
              })}
              noValidate
            >
              {register && (
                <AuthTextField
                  name="name"
                  label={t('Your name')}
                  autoComplete="name"
                  placeholder="Alex Fisher"
                />
              )}
              <AuthTextField
                name="email"
                label={t('Email address')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
              <PasswordField
                label={t('Password')}
                registration={form.register('password')}
                error={form.formState.errors.password?.message}
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder={register ? t('At least 12 characters') : t('Your password')}
              />
              {!register && (
                <p className="auth-switch">
                  <Link to="/forgot-password">{t('Forgot your password?')}</Link>
                </p>
              )}
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
          </FormProvider>
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
