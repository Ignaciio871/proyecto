import type { BookingData, EstadoTurno, Rol } from './types';

// ─────────────────────────────────────────────────────────
//  CONSTANTES DE DOMINIO
// ─────────────────────────────────────────────────────────
export const services = [
  { id: 'Examen de la vista',              label: 'Examen de la vista' },
  { id: 'Control de glaucoma',             label: 'Control de glaucoma' },
  { id: 'Adaptación de lentes de contacto',label: 'Adaptación de lentes de contacto' },
  { id: 'Consulta pre-quirúrgica',         label: 'Consulta pre-quirúrgica' },
  { id: 'Consultas oftalmológicas',        label: 'Consultas oftalmológicas' }
];

export const timeSlots = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00'
];

export const statusPalette: Record<EstadoTurno, string> = {
  Pendiente:  'bg-amber-100 text-amber-800',
  Confirmado: 'bg-emerald-100 text-emerald-800',
  Cancelado:  'bg-rose-100 text-rose-800'
};

export const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const dayNames   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

export const rolLabels: Record<Rol, string> = { cliente: 'Cliente', administrador: 'Administrador', creador: 'Creador' };
export const rolBadge:  Record<Rol, string> = { cliente: 'badge-cliente', administrador: 'badge-admin', creador: 'badge-creator' };

export const emptyBooking = (): BookingData => ({ servicio: services[0].id, fecha: '', horario: '' });
