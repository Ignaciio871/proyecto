// ─────────────────────────────────────────────────────────
//  ROLES  (se guardan en Firestore /usuarios/{uid}.rol)
//  'cliente'       → reserva y gestiona sus propios turnos
//  'administrador' → confirma / cancela todos los turnos
//  'creador'       → panel completo + gestión de usuarios
// ─────────────────────────────────────────────────────────
export type Rol = 'cliente' | 'administrador' | 'creador';

export type EstadoTurno = 'Pendiente' | 'Confirmado' | 'Cancelado';

export interface Perfil {
  nombre:          string;
  apellido:        string;
  dni:             string;
  fechaNacimiento: string;
  telefono:        string;
  email:           string;
  rol:             Rol;
}

export interface Usuario extends Perfil {
  id: string;
}

export interface Turno {
  id:             string;
  usuario_id:     string;
  usuario_email:  string;
  usuario_nombre: string;
  servicio:       string;
  fecha:          string;
  horario:        string;
  estado:         EstadoTurno;
}

export interface BookingData {
  servicio: string;
  fecha:    string;
  horario:  string;
}

export type BookingStep = 'service' | 'date' | 'time' | 'summary';

export type ToastType = 'success' | 'error' | 'info';
