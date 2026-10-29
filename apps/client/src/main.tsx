import { t, useTranslation, initializeLanguage } from './lib/i18n';
import React, { Suspense, lazy, Component, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Outlet,
  ScrollRestoration,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './lib/auth';
import { initializeTheme } from './lib/theme';
import { Loading, Failure, Empty } from './components/common';
import { Button } from './components/ui/button';
import { UnsavedChangesProvider } from './components/navigation/UnsavedChanges';
import './styles/index.css';
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Collection = lazy(() => import('./pages/Collection'));
const Journal = lazy(() => import('./pages/Journal'));
const Forms = lazy(() => import('./pages/Forms'));
const Details = lazy(() => import('./pages/Details'));
const Profile = lazy(() => import('./pages/Profile'));
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error">
        <h1>{t('Something went wrong')}</h1>
        <Empty
          title={t('We hit a snag.')}
          description={t('Your stories are safe. Reload to get back to the water.')}
        />
        <Button onClick={() => location.reload()}>{t('Reload LureLog')}</Button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Protected() {
  useTranslation();

  const { user, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (error) return <Failure error={error} retry={() => void refresh()} />;
  return user ? <Layout /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false } },
});
const stopThemeSync = initializeTheme();
const stopLanguageSync = initializeLanguage();
const root = ReactDOM.createRoot(document.getElementById('root')!);
function AppFrame() {
  useTranslation();
  return (
    <AuthProvider>
      <UnsavedChangesProvider>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
        <ScrollRestoration
          getKey={(location) =>
            ['/lures', '/catches'].includes(location.pathname)
              ? location.pathname + location.search
              : location.key
          }
        />
        <Toaster position="bottom-right" richColors closeButton />
      </UnsavedChangesProvider>
    </AuthProvider>
  );
}
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route
      element={<AppFrame />}
      errorElement={
        <main className="fatal-error">
          <h1>{t('Something went wrong')}</h1>
          <Button onClick={() => location.reload()}>{t('Reload LureLog')}</Button>
        </main>
      }
    >
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />
      <Route element={<Protected />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lures" element={<Collection />} />
        <Route path="/lures/new" element={<Forms kind="lure" />} />
        <Route path="/lures/:id" element={<Details kind="lure" />} />
        <Route path="/lures/:id/edit" element={<Forms kind="lure" />} />
        <Route path="/lures/:id/catches/new" element={<Forms kind="catch" />} />
        <Route path="/catches" element={<Journal />} />
        <Route path="/catches/new" element={<Forms kind="catch" />} />
        <Route path="/catches/:id" element={<Details kind="catch" />} />
        <Route path="/catches/:id/edit" element={<Forms kind="catch" />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route
        path="*"
        element={
          <main className="not-found">
            <h1>{t('Page not found')}</h1>
            <Empty
              title={t('A little off the beaten path.')}
              description={t('This page isn’t here, but your next adventure is.')}
            />
            <Button asChild>
              <Link to="/">{t('Find your way home')}</Link>
            </Button>
          </main>
        }
      />
    </Route>,
  ),
);
function App() {
  useTranslation();
  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Dispose the previous tree before Vite reevaluates the entry module.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopThemeSync();
    stopLanguageSync();
    root.unmount();
    router.dispose();
  });
}
