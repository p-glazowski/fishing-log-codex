import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerSchema, loginSchema } from '@lurelog/shared';
import { ArrowRight, Fish, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { data, json, errorMessage } from '../lib/api';
import { Logo } from '../components/Layout';
import { Button } from '../components/ui/button';
export default function Auth({ register = false }: { register?: boolean }) {
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
      <div className="auth-visual">
        <Logo />
        <div>
          <span className="eyebrow">A LIFE WELL CAST</span>
          <h1>
            There’s a story
            <br />
            behind every catch.
          </h1>
          <p>
            Keep your favorite lures, unforgettable catches,
            <br />
            and days on the water together.
          </p>
        </div>
        <span className="auth-quote">
          <Fish size={20} /> Less remembering. More fishing.
        </span>
      </div>
      <div className="auth-panel">
        <Link className="back-link" to="/">
          ← Back to LureLog
        </Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR NEXT CHAPTER</span>
          <h1>{register ? 'Start your fishing story.' : 'Welcome back, angler.'}</h1>
          <p>
            {register
              ? 'A little organization. A lot more adventure.'
              : 'Your collection and your memories are waiting.'}
          </p>
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            {register && (
              <label>
                Your name
                <input autoComplete="name" placeholder="Alex Fisher" {...form.register('name')} />
                <span className="field-error">{form.formState.errors.name?.message}</span>
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...form.register('email')}
              />
              <span className="field-error">{form.formState.errors.email?.message}</span>
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder={register ? 'At least 12 characters' : 'Your password'}
                {...form.register('password')}
              />
              <span className="field-error">{form.formState.errors.password?.message}</span>
            </label>
            {form.formState.errors.root && (
              <p role="alert" className="error-banner">
                {form.formState.errors.root.message}
              </p>
            )}
            <Button className="full-width" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'One moment…'
                : register
                  ? 'Create your free account'
                  : 'Sign in'}
              <ArrowRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New around here?'}{' '}
            <Link to={register ? '/login' : '/register'}>
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
          <div className="privacy-note">
            <ShieldCheck size={16} />
            Your collection is private. Always yours.
          </div>
        </div>
      </div>
    </div>
  );
}
