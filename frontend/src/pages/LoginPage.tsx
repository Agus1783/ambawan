import { useEffect, useRef, useState } from 'react';
import api, { pesanErrorApi, type PublicUser } from '../utils/api';
import { getGoogleClientId, loadGoogleIdentity } from '../utils/google';
import LoginForm from '../components/forms/LoginForm';
import { btnClass, cardClass, mutedClass } from '../components/ui/UiClasses';

export function LoginPage({
  notice,
  onAuthenticated,
  onGoRegister,
}: {
  notice?: string | null;
  onAuthenticated: (user: PublicUser) => void;
  onGoRegister: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const onAuthenticatedRef = useRef(onAuthenticated);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  });

  const googleClientId = getGoogleClientId();

  useEffect(() => {
    if (!googleClientId) {
      return;
    }
    let cancelled = false;
    loadGoogleIdentity()
      .then((accounts) => {
        if (cancelled) {
          return;
        }
        accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            setLoading(true);
            setError(null);
            api
              .loginWithGoogle(response.credential)
              .then(({ user }) => onAuthenticatedRef.current(user))
              .catch((err: unknown) => setError(pesanErrorApi(err)))
              .finally(() => setLoading(false));
          },
        });
        if (googleButtonRef.current) {
          accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'signin_with',
          });
        }
        setGoogleReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleError('Tombol Google gagal dimuat. Coba login dengan email.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [googleClientId]);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await api.login(credentials);
      onAuthenticated(user);
    } catch (err: unknown) {
      setError(pesanErrorApi(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-16 pb-10">
      <div className={`${cardClass} w-full max-w-[420px]`}>
        <h1 className="font-black text-[26px] uppercase m-0">AmbaDo</h1>
        <p className={`${mutedClass} font-mk-mono text-[11px] tracking-[0.14em] uppercase mt-1 mb-5`}>
          Masuk ke workspace kamu
        </p>

        {notice && (
          <p className="border-2 border-black dark:border-[#f2f2ed] rounded-lg bg-mk-green-soft px-3 py-2 text-sm mb-4">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="border-2 border-black dark:border-[#f2f2ed] rounded-lg bg-mk-red-soft px-3 py-2 text-sm mb-4">
            {error}
          </p>
        )}

        <LoginForm login={handleLogin} disabled={loading} />
        {loading && <p className={`${mutedClass} text-sm mt-3`}>Memproses...</p>}

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 border-t-2 border-[#e5e5e0] dark:border-[#404040]" />
          <span className={`${mutedClass} font-mk-mono text-[10px] tracking-[0.18em] uppercase`}>atau</span>
          <span className="flex-1 border-t-2 border-[#e5e5e0] dark:border-[#404040]" />
        </div>

        {googleClientId ? (
          <>
            <div ref={googleButtonRef} className="flex justify-center" />
            {!googleReady && !googleError && (
              <p className={`${mutedClass} text-sm text-center`}>Memuat tombol Google...</p>
            )}
            {googleError && (
              <p className={`${mutedClass} text-sm text-center`}>{googleError}</p>
            )}
          </>
        ) : (
          <p className={`${mutedClass} text-sm text-center`}>
            Login dengan Google belum dikonfigurasi (isi VITE_GOOGLE_CLIENT_ID).
          </p>
        )}

        <p className="text-sm text-center mt-5">
          Belum punya akun?{' '}
          <button type="button" className={`${btnClass} px-3 py-1`} onClick={onGoRegister}>
            Daftar
          </button>
        </p>
      </div>
    </div>
  );
}
