'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { emptyBooking, rolBadge, rolLabels, services, timeSlots } from '@/lib/constants';
import { errorMessage } from '@/lib/utils';
import type { BookingData, BookingStep, Perfil, Rol, Turno } from '@/lib/types';
import { useTurnos } from '@/hooks/useTurnos';
import { useToast } from './ToastProvider';
import { icons } from './icons';
import { TurnoCard } from './TurnoCard';
import { Calendar } from './booking/Calendar';
import { TimeGrid } from './booking/TimeGrid';
import { BookingSummary } from './booking/BookingSummary';

interface DashboardProps {
  user:     User;
  perfil:   Perfil | null;
  rol:      Rol;
  onLogout: () => void;
}

const activeSlotsQuery = (fecha: string) =>
  query(collection(db, 'turnos'), where('fecha','==',fecha), where('estado','in',['Pendiente','Confirmado']));

// ─────────────────────────────────────────────────────────
//  PANEL ADMINISTRADOR / CLIENTE (dashboard)
// ─────────────────────────────────────────────────────────
export function Dashboard({ user, perfil, rol, onLogout }: DashboardProps) {
  const notify  = useToast();
  const isAdmin = rol === 'administrador';
  const { myTurnos, allTurnos, refresh, cancelTurno, confirmTurno } = useTurnos(user.uid, rol);

  const [loading,      setLoading]     = useState(false);
  const [calendarMonth,setCalMonth]    = useState(() => new Date());
  const [bookingStep,  setBookingStep] = useState<BookingStep>('service');
  const [bookingData,  setBookingData] = useState<BookingData>(emptyBooking);
  const [bookedSlots,  setBookedSlots] = useState<string[]>([]);
  const [editingTurno, setEditingTurno]= useState<string | null>(null);

  const fetchBookedSlots = async (fecha: string) => {
    const snap = await getDocs(activeSlotsQuery(fecha));
    setBookedSlots(snap.docs.map(d => d.data().horario as string));
  };

  // ── Cargar horarios ocupados al cambiar fecha ─────────
  useEffect(() => {
    if (bookingData.fecha) fetchBookedSlots(bookingData.fecha);
  }, [bookingData.fecha]);

  const resetBooking = () => {
    setEditingTurno(null);
    setBookingStep('service');
    setBookingData(emptyBooking());
  };

  // ─────────────────────────────────────────────────────
  //  TURNOS HANDLERS
  // ─────────────────────────────────────────────────────
  const handleServiceSelect = (id: string) => {
    setBookingData(p => ({ ...p, servicio: id }));
    setBookingStep('date');
  };

  const handleDateSelect = (fecha: string) => {
    setBookingData(p => ({ ...p, fecha, horario:'' }));
    setBookingStep('time');
  };

  const handleSlotSelect = (slot: string) => {
    if (bookedSlots.includes(slot)) { notify('Ese horario ya está reservado.', 'error'); return; }
    setBookingData(p => ({ ...p, horario: slot }));
    setBookingStep('summary');
  };

  const handleCreateOrUpdate = async () => {
    if (!bookingData.servicio || !bookingData.fecha || !bookingData.horario) {
      notify('Seleccioná servicio, fecha y horario.', 'error');
      return;
    }
    setLoading(true);
    try {
      // Verificar conflicto
      const conflict = await getDocs(query(activeSlotsQuery(bookingData.fecha), where('horario','==',bookingData.horario)));

      if (!conflict.empty && (!editingTurno || conflict.docs.some(d => d.id !== editingTurno))) {
        notify('Ese horario fue reservado mientras elegías. Intentá con otro.', 'error');
        setBookingStep('time');
        fetchBookedSlots(bookingData.fecha);
        return;
      }

      if (editingTurno) {
        await updateDoc(doc(db, 'turnos', editingTurno), {
          servicio: bookingData.servicio,
          fecha:    bookingData.fecha,
          horario:  bookingData.horario,
          estado:   'Pendiente'
        });
        notify('Turno reprogramado correctamente.', 'success');
      } else {
        await addDoc(collection(db, 'turnos'), {
          usuario_id:    user.uid,
          usuario_email: user.email,
          usuario_nombre:perfil?.nombre || '',
          servicio:      bookingData.servicio,
          fecha:         bookingData.fecha,
          horario:       bookingData.horario,
          estado:        'Pendiente',
          createdAt:     serverTimestamp()
        });
        notify('Turno reservado con éxito.', 'success');
      }

      resetBooking();
      refresh();
    } catch (err) {
      notify('Error al guardar el turno: ' + errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (turno: Turno) => {
    setEditingTurno(turno.id);
    setBookingData({ servicio: turno.servicio, fecha: turno.fecha, horario: turno.horario });
    setBookingStep('time');
    setCalMonth(new Date(turno.fecha + 'T00:00:00'));
    notify('Seleccioná una nueva fecha y horario para reprogramar.', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const turnos = isAdmin ? allTurnos : myTurnos;

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <header className="rounded-[32px] bg-white px-6 py-6 shadow-suave sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-farmacia">Centro Oftalmológico</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Hola, {perfil?.nombre || user.email}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? 'Podés confirmar y gestionar todos los turnos.' : 'Reservá, cancelá y reprogramá tus turnos.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-2xl px-4 py-2 text-sm font-semibold ${rolBadge[rol]}`}>
              {rolLabels[rol]}
            </span>
            <button onClick={onLogout}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-farmacia hover:text-farmacia transition">
              {icons.logout} Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Reserva */}
        <section className="rounded-[32px] bg-white p-6 shadow-suave sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-farmacia">Nueva Reserva</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {editingTurno ? 'Reprogramar turno' : 'Reservar turno'}
              </h2>
            </div>
            {editingTurno &&
              <button type="button" onClick={resetBooking}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-rose-400 hover:text-rose-600 transition">
                Cancelar edición
              </button>
            }
          </div>
          <div className="space-y-5">
            {/* Paso 1 - servicio */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">01. Seleccioná el servicio</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {services.map(s => (
                  <button key={s.id} type="button" onClick={() => handleServiceSelect(s.id)}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${bookingData.servicio === s.id ? 'border-farmacia bg-farmacia/10 text-farmacia' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-farmacia/60 hover:bg-farmacia/5'}`}>
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="mt-1 text-xs text-slate-500">Confirmación inmediata</p>
                  </button>
                ))}
              </div>
            </div>
            {/* Paso 2 - fecha */}
            {bookingStep !== 'service' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">02. Elegí la fecha</p>
                  <button type="button" onClick={() => setBookingStep('date')} className="text-xs font-semibold text-farmacia hover:underline">Cambiar</button>
                </div>
                <Calendar month={calendarMonth} setMonth={setCalMonth} selected={bookingData.fecha} onSelect={handleDateSelect} />
              </div>
            )}
            {/* Paso 3 - horario */}
            {bookingStep !== 'service' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">03. Reservá el horario</p>
                {bookingData.fecha
                  ? <TimeGrid bookedSlots={bookedSlots} selected={bookingData.horario} onSelect={handleSlotSelect} />
                  : <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Seleccioná una fecha primero.</p>}
              </div>
            )}
            {/* Paso 4 - resumen */}
            {bookingStep === 'summary' &&
              <BookingSummary data={bookingData} loading={loading} editing={!!editingTurno}
                onBack={() => setBookingStep('time')} onConfirm={handleCreateOrUpdate} />
            }
          </div>
        </section>

        {/* Stats */}
        <aside className="space-y-4">
          <div className="rounded-[32px] bg-white p-6 shadow-suave">
            <p className="text-xs font-semibold uppercase tracking-wider text-farmacia">Estado en vivo</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-3xl border border-slate-200 bg-fondo p-4">
                <p className="text-xs text-slate-500">Horarios ocupados hoy</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{bookingData.fecha ? bookedSlots.length : '-'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-fondo p-4">
                <p className="text-xs text-slate-500">Disponibilidad restante</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{bookingData.fecha ? timeSlots.length - bookedSlots.length : '-'}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-fondo p-4">
                <p className="text-xs text-slate-500">Mis turnos activos</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{myTurnos.filter(t => t.estado !== 'Cancelado').length}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mis turnos */}
      <section className="rounded-[32px] bg-white p-6 shadow-suave">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-farmacia">
              {isAdmin ? 'Todos los Turnos' : 'Mis Turnos'}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Resumen y gestión</h3>
          </div>
          <button onClick={refresh}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-farmacia hover:text-farmacia transition">
            Actualizar
          </button>
        </div>
        {turnos.length === 0
          ? <p className="rounded-3xl border border-dashed border-slate-300 bg-fondo p-6 text-sm text-slate-500">No hay turnos registrados.</p>
          : <div className="space-y-3">
              {turnos.map(t => (
                <TurnoCard key={t.id} turno={t} showUser={isAdmin} currentUid={user.uid} canConfirm={isAdmin}
                  onCancel={cancelTurno} onConfirm={confirmTurno} onReschedule={handleReschedule} />
              ))}
            </div>
        }
      </section>
    </div>
  );
}
