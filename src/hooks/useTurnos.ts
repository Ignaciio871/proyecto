'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDocs, orderBy, query, updateDoc, where, type QuerySnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ToastProvider';
import type { EstadoTurno, Rol, Turno } from '@/lib/types';

const toTurnos = (snap: QuerySnapshot) =>
  snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Turno, 'id'>) }));

// ─────────────────────────────────────────────────────────
//  TURNOS: carga y acciones compartidas por los paneles
// ─────────────────────────────────────────────────────────
export function useTurnos(uid: string, rol: Rol) {
  const notify = useToast();
  const [myTurnos,  setMyTurnos]  = useState<Turno[]>([]);
  const [allTurnos, setAllTurnos] = useState<Turno[]>([]);  // para admin / creador

  const canManage = rol === 'administrador' || rol === 'creador';

  const fetchMyTurnos = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'turnos'), where('usuario_id','==',uid), orderBy('fecha','desc')));
    setMyTurnos(toTurnos(snap));
  }, [uid]);

  const fetchAllTurnos = useCallback(async () => {
    const snap = await getDocs(query(collection(db, 'turnos'), orderBy('fecha','desc')));
    setAllTurnos(toTurnos(snap));
  }, []);

  const refresh = useCallback(() => {
    fetchMyTurnos();
    if (canManage) fetchAllTurnos();
  }, [fetchMyTurnos, fetchAllTurnos, canManage]);

  useEffect(() => { refresh(); }, [refresh]);

  const setEstado = async (turno: Turno, estado: EstadoTurno, okMsg: string, errMsg: string) => {
    try {
      await updateDoc(doc(db, 'turnos', turno.id), { estado });
      notify(okMsg, estado === 'Confirmado' ? 'success' : 'info');
      refresh();
    } catch {
      notify(errMsg, 'error');
    }
  };

  const cancelTurno  = (turno: Turno) => setEstado(turno, 'Cancelado',  'Turno cancelado.',  'No se pudo cancelar el turno.');
  const confirmTurno = (turno: Turno) => setEstado(turno, 'Confirmado', 'Turno confirmado.', 'No se pudo confirmar el turno.');

  return { myTurnos, allTurnos, canManage, fetchAllTurnos, refresh, cancelTurno, confirmTurno };
}
