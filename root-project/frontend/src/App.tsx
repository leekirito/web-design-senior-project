import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, apiRequest, clearToken, getToken } from './lib/api';
import { auth, type AuthUser } from './lib/auth';

interface HealthStatus {
  status: string;
  database: string;
}

type AuthMode = 'login' | 'register';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const firstValidationError = Object.values(error.errors ?? {}).flat()[0];

    return firstValidationError ?? error.message;
  }

  return 'Unable to reach the API. Is the Laravel server running?';
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(() => getToken() !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    let isActive = true;

    void apiRequest<HealthStatus>('/health')
      .then((result) => {
        if (isActive) {
          setHealth(result);
        }
      })
      .catch(() => {
        if (isActive) {
          setHealth(null);
        }
      });

    if (!getToken()) {
      return () => {
        isActive = false;
      };
    }

    void auth
      .me()
      .then((currentUser) => {
        if (isActive) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isActive) {
          clearToken();
        }
      })
      .finally(() => {
        if (isActive) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const authenticatedUser =
        mode === 'register'
          ? await auth.register({
              name,
              email,
              password,
              password_confirmation: passwordConfirmation,
            })
          : await auth.login({ email, password });

      setUser(authenticatedUser);
      setPassword('');
      setPasswordConfirmation('');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await auth.logout().catch(() => undefined);
    setUser(null);
  }

  const isHealthy = health?.status === 'ok' && health.database === 'connected';

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Full-stack starter</h1>
          <p className="text-slate-400">
            React + TypeScript + Tailwind talking to Laravel, Sanctum, and MySQL.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h2 className="text-lg font-medium">API health</h2>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`size-3 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-amber-400'}`}
              aria-hidden="true"
            />
            <p className="text-sm text-slate-300">
              {isHealthy
                ? 'Laravel is reachable and the database is connected.'
                : 'Waiting for Laravel on http://127.0.0.1:8000 ...'}
            </p>
          </div>
        </section>

        {isCheckingSession ? (
          <p className="text-sm text-slate-400">Checking your session...</p>
        ) : user ? (
          <section className="flex flex-col gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-medium">Welcome, {user.name}</h2>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
            <p className="text-sm text-slate-300">
              This content is protected by <code className="text-emerald-300">auth:sanctum</code>.
            </p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="self-start rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              Log out
            </button>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex gap-2" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === 'login' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  mode === 'register'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Register
              </button>
            </div>

            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="mt-6 flex flex-col gap-4"
            >
              {mode === 'register' && (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-slate-300">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
              )}

              <label className="flex flex-col gap-2 text-sm">
                <span className="text-slate-300">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="text-slate-300">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={mode === 'register' ? 8 : undefined}
                  required
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                />
              </label>

              {mode === 'register' && (
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-slate-300">Confirm password</span>
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
              )}

              {error && (
                <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="self-start rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;
