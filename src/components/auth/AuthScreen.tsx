'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { traducirError } from '@/lib/utils';
import { validate, validateForm, type Errors, type Field } from '@/lib/validation';
import type { Perfil, Rol } from '@/lib/types';
import { useToast } from '../ToastProvider';
import { InputField } from '../InputField';
import { icons } from '../icons';

type AuthTab = 'login' | 'register' | 'reset';

interface RoleButtonProps {
  value:    Rol;
  current:  Rol;
  onChange: (v: Rol) => void;
  label:    string;
  desc:     string;
  icon:     ReactNode;
}

const RoleButton = ({ value, current, onChange, label, desc, icon }: RoleButtonProps) => (
  <button type="button" onClick={() => onChange(value)}
    className={`rounded-2xl border p-4 text-left transition ${current === value ? 'border-farmacia bg-farmacia/10' : 'border-slate-200 bg-white hover:border-farmacia/50'}`}>
    <div className="flex items-center gap-2">
      <span className={`text-lg ${current === value ? 'text-farmacia' : 'text-slate-400'}`}>{icon}</span>
      <span className={`text-sm font-semibold ${current === value ? 'text-farmacia' : 'text-slate-700'}`}>{label}</span>
    </div>
    <p className="mt-1 text-xs text-slate-500">{desc}</p>
  </button>
);

const submitClass = 'w-full rounded-2xl bg-farmacia px-5 py-3 text-sm font-semibold text-white transition hover:bg-farmacia/90 disabled:opacity-60';

interface AuthScreenProps {
  onProfileCreated: (perfil: Perfil) => void;
}

// ─────────────────────────────────────────────────────────
//  PANTALLA DE AUTH
// ─────────────────────────────────────────────────────────
export function AuthScreen({ onProfileCreated }: AuthScreenProps) {
  const notify = useToast();
  const [authTab,    setAuthTab]    = useState<AuthTab>('login');
  const [loading,    setLoading]    = useState(false);
  const [loginData,  setLoginData]  = useState({ email:'', password:'' });
  const [regData,    setRegData]    = useState({ nombre:'', apellido:'', dni:'', fechaNacimiento:'', telefono:'', email:'', password:'', rol:'cliente' as Rol });
  const [resetEmail, setResetEmail] = useState('');
  const [errors,     setErrors]     = useState<Errors>({});

  // Actualiza un campo y lo valida en vivo
  const fieldHandler = <T extends Record<string, unknown>>(setter: (fn: (p: T) => T) => void, key: Field) =>
    (e: { target: { value: string } }) => {
      const value = e.target.value;
      setter(p => ({ ...p, [key]: value }));
      setErrors(p => ({ ...p, [key]: validate[key](value) }));
    };

  const onLoginEmail = fieldHandler<typeof loginData>(setLoginData, 'email');
  const onLoginPassword = fieldHandler<typeof loginData>(setLoginData, 'password');
  const onReg = (key: Field) => fieldHandler<typeof regData>(setRegData, key);

  // ─────────────────────────────────────────────────────
  //  AUTH HANDLERS
  // ─────────────────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm(loginData, ['email','password'], setErrors)) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    } catch (err) {
      notify(traducirError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm(regData, ['nombre','apellido','dni','fechaNacimiento','telefono','email','password'], setErrors)) return;
    setLoading(true);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, regData.email, regData.password);
      await updateProfile(fbUser, { displayName: `${regData.nombre} ${regData.apellido}` });
      // Guardar perfil en Firestore
      const perfil: Perfil = {
        nombre:          regData.nombre,
        apellido:        regData.apellido,
        dni:             regData.dni,
        fechaNacimiento: regData.fechaNacimiento,
        telefono:        regData.telefono,
        email:           regData.email,
        rol:             regData.rol
      };
      await setDoc(doc(db, 'usuarios', fbUser.uid), { ...perfil, createdAt: serverTimestamp() });
      onProfileCreated(perfil);
      notify('Cuenta creada correctamente. ¡Bienvenido/a!', 'success');
    } catch (err) {
      notify(traducirError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm({ email: resetEmail }, ['email'], setErrors)) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      notify('Revisá tu bandeja de entrada para restablecer la contraseña.', 'success');
      setAuthTab('login');
    } catch (err) {
      notify(traducirError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  //  FORMULARIOS
  // ─────────────────────────────────────────────────────
  const loginForm = (
    <form onSubmit={handleLogin} className="space-y-5">
      <InputField label="Email" name="email" type="email" value={loginData.email} placeholder="usuario@correo.com" icon={icons.email} error={errors.email} onChange={onLoginEmail} />
      <InputField label="Contraseña" name="password" type="password" value={loginData.password} placeholder="Mínimo 8 caracteres" icon={icons.lock} error={errors.password} onChange={onLoginPassword} />
      <button type="button" onClick={() => setAuthTab('reset')} className="text-sm font-semibold text-slate-500 hover:text-farmacia transition">
        ¿Olvidaste tu contraseña?
      </button>
      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>
      <p className="text-center text-sm text-slate-500">
        ¿No tenés cuenta?{' '}
        <button type="button" onClick={() => setAuthTab('register')} className="font-semibold text-farmacia hover:underline">Crear cuenta</button>
      </p>
    </form>
  );

  const registerForm = (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Nombre" name="nombre" value={regData.nombre} placeholder="Juan" icon={icons.user} error={errors.nombre} onChange={onReg('nombre')} />
        <InputField label="Apellido" name="apellido" value={regData.apellido} placeholder="Pérez" icon={icons.user} error={errors.apellido} onChange={onReg('apellido')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="DNI" name="dni" value={regData.dni} placeholder="12345678" icon={icons.user} error={errors.dni} onChange={onReg('dni')} />
        <InputField label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={regData.fechaNacimiento} icon={icons.calendar} error={errors.fechaNacimiento} onChange={onReg('fechaNacimiento')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Teléfono" name="telefono" value={regData.telefono} placeholder="1123456789" icon={icons.phone} error={errors.telefono} onChange={onReg('telefono')} />
        <InputField label="Email" name="email" type="email" value={regData.email} placeholder="usuario@correo.com" icon={icons.email} error={errors.email} onChange={onReg('email')} />
      </div>
      <InputField label="Contraseña" name="password" type="password" value={regData.password} placeholder="Mínimo 8 caracteres" icon={icons.lock} error={errors.password} onChange={onReg('password')} />

      {/* Selector de rol */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Rol en el sistema</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <RoleButton value="cliente" current={regData.rol} onChange={v => setRegData(p=>({...p,rol:v}))}
            icon="👤" label="Cliente" desc="Reserva y gestiona sus propios turnos" />
          <RoleButton value="administrador" current={regData.rol} onChange={v => setRegData(p=>({...p,rol:v}))}
            icon="🛡️" label="Administrador" desc="Confirma y gestiona todos los turnos" />
        </div>
        <p className="mt-2 text-xs text-slate-400">El rol <strong>Creador</strong> solo puede asignarse desde el panel de administración.</p>
      </div>

      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p className="text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <button type="button" onClick={() => setAuthTab('login')} className="font-semibold text-farmacia hover:underline">Ingresar</button>
      </p>
    </form>
  );

  const resetForm = (
    <form onSubmit={handleReset} className="space-y-5">
      <p className="text-sm text-slate-600">Te enviaremos un enlace para restablecer tu contraseña.</p>
      <InputField label="Email" name="email" type="email" value={resetEmail} placeholder="usuario@correo.com" icon={icons.email} error={errors.email}
        onChange={e => { setResetEmail(e.target.value); setErrors(p=>({...p,email:validate.email(e.target.value)})); }} />
      <button type="submit" disabled={loading} className={submitClass}>
        {loading ? 'Enviando…' : 'Enviar enlace'}
      </button>
      <p className="text-center text-sm text-slate-500">
        <button type="button" onClick={() => setAuthTab('login')} className="font-semibold text-farmacia hover:underline">Volver al ingreso</button>
      </p>
    </form>
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-10 sm:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {/* Hero */}
        <section className="space-y-6 rounded-[32px] bg-white px-6 py-8 shadow-suave sm:px-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-farmacia/10 px-3 py-1 text-sm font-semibold text-farmacia">Centro Oftalmológico</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Sistema de turnos online</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Reservá turnos para exámenes de la vista, controles y consultas oftalmológicas. Disponibilidad en tiempo real.</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-fondo p-5 space-y-3">
            {[
              ['👤', 'bg-farmacia/10 text-farmacia', 'Cliente',       'Reserva, cancela y reprograma sus propios turnos.'],
              ['🛡️', 'bg-indigo-100',                'Administrador', 'Confirma y gestiona todos los turnos del sistema.'],
              ['👑', 'bg-violet-100',                'Creador',       'Acceso total: gestión de usuarios, roles y todos los turnos.']
            ].map(([emoji, bg, title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${bg}`}>{emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Formulario */}
        <section className="rounded-[32px] bg-white px-6 py-8 shadow-suave sm:px-10">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-farmacia">Autenticación</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {authTab==='login' ? 'Iniciá sesión' : authTab==='register' ? 'Crear cuenta' : 'Restablecer contraseña'}
            </h2>
          </div>
          {/* Tabs login/register */}
          {authTab !== 'reset' && (
            <div className="mb-6 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {([['login','Ingresar'],['register','Registrarse']] as const).map(([tab,label]) => (
                <button key={tab} type="button" onClick={() => setAuthTab(tab)}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${authTab===tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {authTab==='login'    && loginForm}
          {authTab==='register' && registerForm}
          {authTab==='reset'    && resetForm}
        </section>
      </div>
    </div>
  );
}
