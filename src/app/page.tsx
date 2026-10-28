'use client';

import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { CreadorPanel } from '@/components/CreadorPanel';
import { Dashboard } from '@/components/Dashboard';

export default function Home() {
  const { view, user, perfil, setPerfil, logout } = useAuth();
  const rol = perfil?.rol || 'cliente';

  if (view === 'loading') return (
    <div className="flex min-h-screen items-center justify-center bg-fondo">
      <div className="text-center loading-pulse">
        <p className="text-2xl font-semibold text-farmacia">Centro Oftalmológico</p>
        <p className="mt-2 text-sm text-slate-500">Iniciando sesión…</p>
      </div>
    </div>
  );

  if (view === 'auth' || !user) return <AuthScreen onProfileCreated={setPerfil} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {rol === 'creador'
        ? <CreadorPanel user={user} onLogout={logout} />
        : <Dashboard key={rol} user={user} perfil={perfil} rol={rol} onLogout={logout} />}
    </div>
  );
}
