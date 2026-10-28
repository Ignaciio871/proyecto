'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { rolBadge, rolLabels } from '@/lib/constants';
import type { Rol, Usuario } from '@/lib/types';
import { useTurnos } from '@/hooks/useTurnos';
import { useToast } from './ToastProvider';
import { icons } from './icons';
import { TurnoCard } from './TurnoCard';

interface CreadorPanelProps {
  user:     User;
  onLogout: () => void;
}

// ─────────────────────────────────────────────────────────
//  PANEL CREADOR
// ─────────────────────────────────────────────────────────
export function CreadorPanel({ user, onLogout }: CreadorPanelProps) {
  const notify = useToast();
  const { allTurnos, fetchAllTurnos, cancelTurno, confirmTurno } = useTurnos(user.uid, 'creador');

  const [creatorTab, setCreatorTab] = useState<'turnos' | 'usuarios'>('turnos');
  const [allUsers,   setAllUsers]   = useState<Usuario[]>([]);

  const fetchAllUsers = useCallback(async () => {
    const snap = await getDocs(collection(db, 'usuarios'));
    setAllUsers(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Usuario, 'id'>) })));
  }, []);

  useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

  // ── cambiar rol de usuario ─────────────────────────────
  const handleChangeUserRol = async (uid: string, nuevoRol: Rol) => {
    try {
      await updateDoc(doc(db, 'usuarios', uid), { rol: nuevoRol });
      notify(`Rol actualizado a "${rolLabels[nuevoRol]}".`, 'success');
      fetchAllUsers();
    } catch {
      notify('No se pudo actualizar el rol.', 'error');
    }
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div className="creator-header rounded-[32px] px-8 py-6 shadow-suave">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Panel del Creador</p>
            <h1 className="mt-2 text-2xl font-semibold">Centro Oftalmológico</h1>
            <p className="mt-1 text-sm opacity-70">Control total del sistema</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2 text-sm font-semibold">
              {icons.crown} Creador
            </span>
            <button onClick={onLogout}
              className="flex items-center gap-2 rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition">
              {icons.logout} Salir
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-6 flex gap-4 border-t border-white/20 pt-4">
          {([['turnos','Todos los Turnos'],['usuarios','Gestión de Usuarios']] as const).map(([key,label]) => (
            <button key={key} type="button" onClick={() => setCreatorTab(key)}
              className={`pb-2 text-sm transition ${creatorTab===key ? 'font-semibold text-white border-b-2 border-white' : 'opacity-60 hover:opacity-90'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {creatorTab === 'turnos' && (
        <div className="rounded-[32px] bg-white p-6 shadow-suave">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Todos los turnos</h2>
            <button onClick={fetchAllTurnos} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-farmacia hover:text-farmacia transition">
              Actualizar
            </button>
          </div>
          {allTurnos.length === 0
            ? <p className="rounded-3xl border border-dashed border-slate-300 bg-fondo p-6 text-sm text-slate-500">No hay turnos registrados todavía.</p>
            : <div className="space-y-3">
                {allTurnos.map(t => (
                  <TurnoCard key={t.id} turno={t} showUser currentUid={user.uid} canConfirm
                    onCancel={cancelTurno} onConfirm={confirmTurno} />
                ))}
              </div>
          }
        </div>
      )}

      {creatorTab === 'usuarios' && (
        <div className="rounded-[32px] bg-white p-6 shadow-suave">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Usuarios registrados</h2>
            <button onClick={fetchAllUsers} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-farmacia hover:text-farmacia transition">
              Actualizar
            </button>
          </div>
          <div className="space-y-3">
            {allUsers.map(u => (
              <div key={u.id} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{u.nombre} {u.apellido}</p>
                  <p className="text-xs text-slate-500">{u.email} · DNI {u.dni}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rolBadge[u.rol] || 'badge-cliente'}`}>
                    {rolLabels[u.rol] || u.rol}
                  </span>
                  {u.id !== user.uid
                    ? <select value={u.rol}
                        onChange={e => handleChangeUserRol(u.id, e.target.value as Rol)}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-farmacia">
                        <option value="cliente">Cliente</option>
                        <option value="administrador">Administrador</option>
                        <option value="creador">Creador</option>
                      </select>
                    : <span className="text-xs text-slate-400">(tu cuenta)</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
