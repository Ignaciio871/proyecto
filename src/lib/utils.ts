import { monthNames } from './constants';

// ─────────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────────
export const formatInputDate = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const formatFriendlyDate = (date: string) => {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  return `${d.getDate()} de ${monthNames[d.getMonth()]}`;
};

export const getMonthDays = (monthDate: Date) => {
  const y = monthDate.getFullYear(), m = monthDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const total    = new Date(y, m+1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=total; d++)   cells.push(new Date(y,m,d));
  return cells;
};

export const errorMessage = (err: unknown) => err instanceof Error ? err.message : String(err);

// ─────────────────────────────────────────────────────────
//  TRADUCCIÓN DE ERRORES FIREBASE
// ─────────────────────────────────────────────────────────
const errorMap: Record<string, string> = {
  'auth/user-not-found':       'No existe una cuenta con ese email.',
  'auth/wrong-password':       'Contraseña incorrecta.',
  'auth/email-already-in-use': 'Ese email ya está registrado.',
  'auth/invalid-email':        'El formato del email no es válido.',
  'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests':    'Demasiados intentos. Intentá más tarde.',
  'auth/network-request-failed':'Error de red. Verificá tu conexión.',
  'auth/invalid-credential':   'Email o contraseña incorrectos.'
};

export const traducirError = (err: unknown) => {
  const code = (err as { code?: string } | null)?.code ?? '';
  return errorMap[code] || 'Ocurrió un error inesperado.';
};
