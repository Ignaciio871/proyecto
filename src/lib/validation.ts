import type { Dispatch, SetStateAction } from 'react';

// ─────────────────────────────────────────────────────────
//  VALIDACIONES
// ─────────────────────────────────────────────────────────
export const validate = {
  nombre:         (v: string) => v.trim().length >= 2 ? '' : 'Ingresá un nombre válido',
  apellido:       (v: string) => v.trim().length >= 2 ? '' : 'Ingresá un apellido válido',
  dni:            (v: string) => /^\d{7,8}$/.test(v.trim()) ? '' : 'DNI debe tener 7 u 8 dígitos',
  fechaNacimiento:(v: string) => {
    if (!v) return 'Seleccioná tu fecha de nacimiento';
    const age = Math.floor((Date.now() - new Date(v).getTime()) / (1000*60*60*24*365.25));
    return age >= 16 ? '' : 'Debés tener al menos 16 años';
  },
  telefono:       (v: string) => /^\d{10,15}$/.test(v.trim()) ? '' : 'Teléfono inválido',
  email:          (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Email inválido',
  password:       (v: string) => v.length >= 8 ? '' : 'Mínimo 8 caracteres'
};

export type Field  = keyof typeof validate;
export type Errors = Partial<Record<Field, string>>;

export const validateForm = (
  data: Partial<Record<Field, string>>,
  keys: Field[],
  setErrors: Dispatch<SetStateAction<Errors>>
) => {
  const next: Errors = {};
  let valid = true;
  keys.forEach(k => {
    const err = validate[k](data[k] || '');
    next[k] = err;
    if (err) valid = false;
  });
  setErrors(p => ({ ...p, ...next }));
  return valid;
};
