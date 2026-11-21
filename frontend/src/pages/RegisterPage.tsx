import { useState } from 'react';
import api, { pesanErrorApi, type PublicUser } from '../utils/api';
import RegisterForm from '../components/forms/RegisterForm';
import { btnClass, cardClass, mutedClass } from '../components/ui/UiClasses';

export function RegisterPage({
  onRegistered,
  onGoLogin,
}: {
  onRegistered: (user: PublicUser) => void;
  onGoLogin: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (data: {
    name: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const user = await api.register(data);
      onRegistered(user);
    } catch (err: unknown) {
      setError(pesanErrorApi(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 pt-16 pb-10">
      <div className={`${cardClass} w-full max-w-[420px]`}>
        <h1 className="font-black text-[26px] uppercase m-0">Daftar AmbaDo</h1>
        <p className={`${mutedClass} font-mk-mono text-[11px] tracking-[0.14em] uppercase mt-1 mb-5`}>
          Buat akun, lalu masuk untuk mulai
        </p>

        {error && (
          <p role="alert" className="border-2 border-black dark:border-[#f2f2ed] rounded-lg bg-mk-red-soft px-3 py-2 text-sm mb-4">
            {error}
          </p>
        )}

        <RegisterForm register={handleRegister} disabled={loading} />
        {loading && <p className={`${mutedClass} text-sm mt-3`}>Memproses...</p>}
        <p className={`${mutedClass} text-xs mt-3`}>
          Password minimal 8 karakter. Setelah daftar, kamu akan diminta login.
        </p>

        <p className="text-sm text-center mt-5">
          Sudah punya akun?{' '}
          <button type="button" className={`${btnClass} px-3 py-1`} onClick={onGoLogin}>
            Masuk
          </button>
        </p>
      </div>
    </div>
  );
}
