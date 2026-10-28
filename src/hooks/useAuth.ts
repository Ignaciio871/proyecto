'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { errorMessage } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';
import type { Perfil } from '@/lib/types';

export type AuthView = 'loading' | 'auth' | 'dashboard';

export function useAuth() {
  const notify = useToast();
  const [view,   setView]   = useState<AuthView>('loading');
  const [user,   setUser]   = useState<User | null>(null);    // Firebase user obj
  const [perfil, setPerfil] = useState<Perfil | null>(null);  // Firestore /usuarios/{uid}

  // ── Firebase auth listener ─────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        try {
          const snap = await getDoc(doc(db, 'usuarios', fbUser.uid));
          if (snap.exists()) setPerfil(snap.data() as Perfil);
        } catch (err) {
          notify('No se pudo cargar tu perfil: ' + errorMessage(err), 'error');
        }
        setView('dashboard');
      } else {
        setUser(null);
        setPerfil(null);
        setView('auth');
      }
    });
  }, [notify]);

  const logout = async () => {
    await signOut(auth);
    notify('Sesión cerrada.', 'info');
  };

  return { view, user, perfil, setPerfil, logout };
}
