// ─────────────────────────────────────────────────────────
//  CONFIGURACIÓN FIREBASE
//  ➜ Reemplazá estos valores con los de tu proyecto Firebase
// ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyALF64zRvPOMOLDtvct_NLCjVohNDX8KEc",
  authDomain:        "sacar-turnos-dfa64.firebaseapp.com",
  projectId:         "sacar-turnos-dfa64",
  storageBucket:     "sacar-turnos-dfa64.firebasestorage.app",
  messagingSenderId: "137848619039",
  appId:             "1:137848619039:web:a384a888e09eff5c24952a",
  measurementId:     "G-BM5348VB2Q"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ─────────────────────────────────────────────────────────
//  ROLES  (se guardan en Firestore /usuarios/{uid}.rol)
//  'cliente'       → reserva y gestiona sus propios turnos
//  'administrador' → confirma / cancela todos los turnos
//  'creador'       → panel completo + gestión de usuarios
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
//  CONSTANTES DE DOMINIO
// ─────────────────────────────────────────────────────────
const services = [
  { id: 'Examen de la vista',              label: 'Examen de la vista' },
  { id: 'Control de glaucoma',             label: 'Control de glaucoma' },
  { id: 'Adaptación de lentes de contacto',label: 'Adaptación de lentes de contacto' },
  { id: 'Consulta pre-quirúrgica',         label: 'Consulta pre-quirúrgica' },
  { id: 'Consultas oftalmológicas',        label: 'Consultas oftalmológicas' }
];

const timeSlots = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00'
];

const statusPalette = {
  Pendiente:  'bg-amber-100 text-amber-800',
  Confirmado: 'bg-emerald-100 text-emerald-800',
  Cancelado:  'bg-rose-100 text-rose-800'
};

const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const dayNames   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const rolLabels = { cliente: 'Cliente', administrador: 'Administrador', creador: 'Creador' };
const rolBadge  = { cliente: 'badge-cliente', administrador: 'badge-admin', creador: 'badge-creator' };

// ─────────────────────────────────────────────────────────
//  UTILIDADES
// ─────────────────────────────────────────────────────────
const formatInputDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const formatFriendlyDate = (date) => {
  if (!date) return '';
  const d = new Date(date + 'T00:00:00');
  return `${d.getDate()} de ${monthNames[d.getMonth()]}`;
};

// ─────────────────────────────────────────────────────────
//  ÍCONOS SVG INLINE
// ─────────────────────────────────────────────────────────
const icons = {
  user: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-400"><path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z"/></svg>,
  email: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-400"><path fill="currentColor" d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.01L12 13l8-4.99V8H4Zm0 10h16V10l-8 5-8-5v8Z"/></svg>,
  lock: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-400"><path fill="currentColor" d="M17 8V6a5 5 0 0 0-10 0v2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2Zm-8-2a3 3 0 0 1 6 0v2H9V6Zm9 14H6V10h12v10Z"/></svg>,
  calendar: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-400"><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V9h14v11Zm0-13H5V6h14v1Z"/></svg>,
  phone: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-400"><path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24 11.36 11.36 0 0 0 3.55.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.55 1 1 0 0 1-.24 1.05l-2.2 2.2Z"/></svg>,
  shield: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-400"><path fill="currentColor" d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 4 6 2.67V11c0 3.61-2.44 7-6 8.15C8.44 18 6 14.61 6 11V7.67L12 5Z"/></svg>,
  crown: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M5 16 3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5Zm0 3a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2H5Z"/></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5ZM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5Z"/></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z"/></svg>,
  check: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z"/></svg>,
  trash: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>
};

// ─────────────────────────────────────────────────────────
//  VALIDACIONES
// ─────────────────────────────────────────────────────────
const validate = {
  nombre:         (v) => v.trim().length >= 2 ? '' : 'Ingresá un nombre válido',
  apellido:       (v) => v.trim().length >= 2 ? '' : 'Ingresá un apellido válido',
  dni:            (v) => /^\d{7,8}$/.test(v.trim()) ? '' : 'DNI debe tener 7 u 8 dígitos',
  fechaNacimiento:(v) => {
    if (!v) return 'Seleccioná tu fecha de nacimiento';
    const age = Math.floor((new Date() - new Date(v)) / (1000*60*60*24*365.25));
    return age >= 16 ? '' : 'Debés tener al menos 16 años';
  },
  telefono:       (v) => /^\d{10,15}$/.test(v.trim()) ? '' : 'Teléfono inválido',
  email:          (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Email inválido',
  password:       (v) => v.length >= 8 ? '' : 'Mínimo 8 caracteres'
};

const validateForm = (data, keys, setErrors) => {
  const next = {};
  let valid = true;
  keys.forEach(k => {
    const err = validate[k] ? validate[k](data[k] || '') : '';
    next[k] = err;
    if (err) valid = false;
  });
  setErrors(p => ({ ...p, ...next }));
  return valid;
};

// ─────────────────────────────────────────────────────────
//  COMPONENTES REUTILIZABLES
// ─────────────────────────────────────────────────────────
const InputField = ({ label, name, value, icon, type='text', placeholder, error, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${error ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 bg-white'} focus-within:border-farmacia focus-within:ring-2 focus-within:ring-farmacia/20`}>
      {icon}
      <input name={name} type={type} value={value} placeholder={placeholder} onChange={onChange}
        className="w-full border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
    </div>
    {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : null}
  </label>
);

const Toast = ({ msg, type, onClose }) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`} onClick={onClose}>
      <span>{msg}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────
function App() {
  // ── estado global ──────────────────────────────────────
  const [view,         setView]        = React.useState('loading');
  const [user,         setUser]        = React.useState(null);   // Firebase user obj
  const [perfil,       setPerfil]      = React.useState(null);   // Firestore /usuarios/{uid}
  const [toast,        setToast]       = React.useState({ msg:'', type:'info' });
  const [loading,      setLoading]     = React.useState(false);

  // ── auth forms ─────────────────────────────────────────
  const [authTab,      setAuthTab]     = React.useState('login'); // login | register | reset
  const [loginData,    setLoginData]   = React.useState({ email:'', password:'' });
  const [regData,      setRegData]     = React.useState({ nombre:'', apellido:'', dni:'', fechaNacimiento:'', telefono:'', email:'', password:'', rol:'cliente' });
  const [resetEmail,   setResetEmail]  = React.useState('');
  const [errors,       setErrors]      = React.useState({});

  // ── turnos ─────────────────────────────────────────────
  const [calendarMonth,setCalMonth]    = React.useState(new Date());
  const [bookingStep,  setBookingStep] = React.useState('service');
  const [bookingData,  setBookingData] = React.useState({ servicio: services[0].id, fecha:'', horario:'' });
  const [bookedSlots,  setBookedSlots] = React.useState([]);
  const [myTurnos,     setMyTurnos]    = React.useState([]);
  const [editingTurno, setEditingTurno]= React.useState(null);
  const [allTurnos,    setAllTurnos]   = React.useState([]);  // para admin / creador

  // ── panel creador ──────────────────────────────────────
  const [creatorTab,   setCreatorTab]  = React.useState('turnos');
  const [allUsers,     setAllUsers]    = React.useState([]);

  const rol      = perfil?.rol || 'cliente';
  const isAdmin  = rol === 'administrador';
  const isCreador= rol === 'creador';

  const notify = (msg, type='info') => setToast({ msg, type });

  // ── Firebase auth listener ─────────────────────────────
  React.useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        try {
          await loadPerfil(fbUser.uid);
        } catch (err) {
          notify('No se pudo cargar tu perfil: ' + err.message, 'error');
        }
        setView('dashboard');
      } else {
        setUser(null);
        setPerfil(null);
        setView('auth');
      }
    });
    return unsub;
  }, []);

  const loadPerfil = async (uid) => {
    const snap = await db.collection('usuarios').doc(uid).get();
    if (snap.exists) setPerfil(snap.data());
  };

  // ── Cargar turnos cuando hay usuario ──────────────────
  React.useEffect(() => {
    if (!user) return;
    fetchMyTurnos();
    if (isAdmin || isCreador) fetchAllTurnos();
    if (isCreador) fetchAllUsers();
  }, [user, rol]);

  // ── Cargar horarios ocupados al cambiar fecha ─────────
  React.useEffect(() => {
    if (!bookingData.fecha) return;
    fetchBookedSlots(bookingData.fecha);
  }, [bookingData.fecha]);

  // ─────────────────────────────────────────────────────
  //  FIRESTORE HELPERS
  // ─────────────────────────────────────────────────────
  const fetchMyTurnos = async () => {
    const snap = await db.collection('turnos').where('usuario_id','==',user.uid)
      .orderBy('fecha','desc').get();
    setMyTurnos(snap.docs.map(d => ({ id:d.id, ...d.data() })));
  };

  const fetchAllTurnos = async () => {
    const snap = await db.collection('turnos').orderBy('fecha','desc').get();
    setAllTurnos(snap.docs.map(d => ({ id:d.id, ...d.data() })));
  };

  const fetchAllUsers = async () => {
    const snap = await db.collection('usuarios').get();
    setAllUsers(snap.docs.map(d => ({ id:d.id, ...d.data() })));
  };

  const fetchBookedSlots = async (fecha) => {
    const snap = await db.collection('turnos')
      .where('fecha','==',fecha)
      .where('estado','in',['Pendiente','Confirmado'])
      .get();
    setBookedSlots(snap.docs.map(d => d.data().horario));
  };

  // ─────────────────────────────────────────────────────
  //  AUTH HANDLERS
  // ─────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm(loginData, ['email','password'], setErrors)) return;
    setLoading(true);
    try {
      await auth.signInWithEmailAndPassword(loginData.email, loginData.password);
    } catch (err) {
      notify(traducirError(err.code), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm(regData, ['nombre','apellido','dni','fechaNacimiento','telefono','email','password'], setErrors)) return;
    setLoading(true);
    try {
      const { user: fbUser } = await auth.createUserWithEmailAndPassword(regData.email, regData.password);
      await fbUser.updateProfile({ displayName: `${regData.nombre} ${regData.apellido}` });
      // Guardar perfil en Firestore
      await db.collection('usuarios').doc(fbUser.uid).set({
        nombre:          regData.nombre,
        apellido:        regData.apellido,
        dni:             regData.dni,
        fechaNacimiento: regData.fechaNacimiento,
        telefono:        regData.telefono,
        email:           regData.email,
        rol:             regData.rol,
        createdAt:       firebase.firestore.FieldValue.serverTimestamp()
      });
      notify('Cuenta creada correctamente. ¡Bienvenido/a!', 'success');
    } catch (err) {
      notify(traducirError(err.code), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!validateForm({ email: resetEmail }, ['email'], setErrors)) return;
    setLoading(true);
    try {
      await auth.sendPasswordResetEmail(resetEmail);
      notify('Revisá tu bandeja de entrada para restablecer la contraseña.', 'success');
      setAuthTab('login');
    } catch (err) {
      notify(traducirError(err.code), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setBookingData({ servicio: services[0].id, fecha:'', horario:'' });
    setBookingStep('service');
    setMyTurnos([]);
    setAllTurnos([]);
    notify('Sesión cerrada.', 'info');
  };

  // ─────────────────────────────────────────────────────
  //  TURNOS HANDLERS
  // ─────────────────────────────────────────────────────
  const handleServiceSelect = (id) => {
    setBookingData(p => ({ ...p, servicio: id }));
    setBookingStep('date');
  };

  const handleDateSelect = (val) => {
    const fecha = typeof val === 'string' ? val : formatInputDate(val);
    setBookingData(p => ({ ...p, fecha, horario:'' }));
    setBookingStep('time');
  };

  const handleSlotSelect = (slot) => {
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
      const conflict = await db.collection('turnos')
        .where('fecha','==',bookingData.fecha)
        .where('horario','==',bookingData.horario)
        .where('estado','in',['Pendiente','Confirmado'])
        .get();

      if (!conflict.empty && (!editingTurno || conflict.docs.some(d => d.id !== editingTurno))) {
        notify('Ese horario fue reservado mientras elegías. Intentá con otro.', 'error');
        setBookingStep('time');
        fetchBookedSlots(bookingData.fecha);
        return;
      }

      if (editingTurno) {
        await db.collection('turnos').doc(editingTurno).update({
          servicio: bookingData.servicio,
          fecha:    bookingData.fecha,
          horario:  bookingData.horario,
          estado:   'Pendiente'
        });
        notify('Turno reprogramado correctamente.', 'success');
        setEditingTurno(null);
      } else {
        await db.collection('turnos').add({
          usuario_id:    user.uid,
          usuario_email: user.email,
          usuario_nombre:perfil?.nombre || '',
          servicio:      bookingData.servicio,
          fecha:         bookingData.fecha,
          horario:       bookingData.horario,
          estado:        'Pendiente',
          createdAt:     firebase.firestore.FieldValue.serverTimestamp()
        });
        notify('Turno reservado con éxito.', 'success');
      }

      setBookingData({ servicio: services[0].id, fecha:'', horario:'' });
      setBookingStep('service');
      fetchMyTurnos();
      if (isAdmin || isCreador) fetchAllTurnos();
    } catch (err) {
      notify('Error al guardar el turno: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTurno = async (turno) => {
    setLoading(true);
    try {
      await db.collection('turnos').doc(turno.id).update({ estado: 'Cancelado' });
      notify('Turno cancelado.', 'info');
      fetchMyTurnos();
      if (isAdmin || isCreador) fetchAllTurnos();
    } catch (err) {
      notify('No se pudo cancelar el turno.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTurno = async (turno) => {
    setLoading(true);
    try {
      await db.collection('turnos').doc(turno.id).update({ estado: 'Confirmado' });
      notify('Turno confirmado.', 'success');
      fetchMyTurnos();
      fetchAllTurnos();
    } catch (err) {
      notify('No se pudo confirmar el turno.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (turno) => {
    setEditingTurno(turno.id);
    setBookingData({ servicio: turno.servicio, fecha: turno.fecha, horario: turno.horario });
    setBookingStep('time');
    setCalMonth(new Date(turno.fecha + 'T00:00:00'));
    notify('Seleccioná una nueva fecha y horario para reprogramar.', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─────────────────────────────────────────────────────
  //  CREADOR: cambiar rol de usuario
  // ─────────────────────────────────────────────────────
  const handleChangeUserRol = async (uid, nuevoRol) => {
    setLoading(true);
    try {
      await db.collection('usuarios').doc(uid).update({ rol: nuevoRol });
      notify(`Rol actualizado a "${rolLabels[nuevoRol]}".`, 'success');
      fetchAllUsers();
    } catch (err) {
      notify('No se pudo actualizar el rol.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  //  CALENDARIO
  // ─────────────────────────────────────────────────────
  const getMonthDays = (monthDate) => {
    const y = monthDate.getFullYear(), m = monthDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const total    = new Date(y, m+1, 0).getDate();
    const cells    = [];
    for (let i=0; i<firstDay; i++) cells.push(null);
    for (let d=1; d<=total; d++)   cells.push(new Date(y,m,d));
    return cells;
  };

  const renderCalendar = () => {
    const today = new Date();
    const cells = getMonthDays(calendarMonth);
    return (
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">{monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth()-1,1))}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:border-farmacia hover:text-farmacia">‹</button>
            <button type="button" onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth()+1,1))}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:border-farmacia hover:text-farmacia">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
          {dayNames.map(d => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {cells.map((day, i) => {
            const sel  = day && bookingData.fecha === formatInputDate(day);
            const past = day && new Date(formatInputDate(day)) < new Date(formatInputDate(today));
            return (
              <button key={i} type="button" disabled={!day || past}
                onClick={() => day && handleDateSelect(day)}
                className={`rounded-xl border py-1.5 transition ${!day ? 'border-transparent' : past ? 'border-transparent text-slate-300 cursor-not-allowed' : sel ? 'border-farmacia bg-farmacia text-white' : 'border-slate-200 bg-slate-50 hover:border-farmacia hover:bg-farmacia/10'}`}>
                {day ? day.getDate() : ''}
              </button>
            );
          })}
        </div>
        <input type="date" value={bookingData.fecha} min={formatInputDate(today)}
          onChange={e => handleDateSelect(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-farmacia focus:ring-2 focus:ring-farmacia/20" />
      </div>
    );
  };

  const renderTimeGrid = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Horarios disponibles</p>
          <p className="text-xs text-slate-500">Los horarios en rojo ya están reservados.</p>
        </div>
        <div className="space-y-1 text-right text-xs text-slate-500">
          <p><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 mr-1" />Libre</p>
          <p><span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-400 mr-1" />Ocupado</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {timeSlots.map(slot => {
          const occ = bookedSlots.includes(slot);
          const sel = bookingData.horario === slot;
          return (
            <button key={slot} type="button" onClick={() => handleSlotSelect(slot)} disabled={occ}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${occ ? 'border-rose-200 bg-rose-50 text-rose-700 cursor-not-allowed' : sel ? 'border-farmacia bg-farmacia text-white' : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-farmacia hover:bg-farmacia/10'}`}>
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-slate-900">Confirmá tu turno</p>
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[['Servicio',bookingData.servicio],['Fecha',formatFriendlyDate(bookingData.fecha)],['Horario',bookingData.horario]].map(([k,v]) => (
          <div key={k} className="rounded-3xl border border-slate-200 bg-fondo p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">{k}</p>
            <p className="mt-2 font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={() => setBookingStep('time')}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-farmacia hover:text-farmacia transition">
          Cambiar horario
        </button>
        <button type="button" onClick={handleCreateOrUpdate} disabled={loading}
          className="rounded-2xl bg-farmacia px-5 py-3 text-sm font-semibold text-white transition hover:bg-farmacia/90 disabled:opacity-60">
          {loading ? 'Guardando…' : editingTurno ? 'Reprogramar turno' : 'Confirmar turno'}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  TARJETA DE TURNO
  // ─────────────────────────────────────────────────────
  const TurnoCard = ({ turno, showUser = false }) => (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 fade-in-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">{turno.servicio}</p>
          <p className="text-sm text-slate-600">{formatFriendlyDate(turno.fecha)} · {turno.horario}</p>
          {showUser && <p className="text-xs text-slate-400">{turno.usuario_nombre || turno.usuario_email}</p>}
        </div>
        <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold ${statusPalette[turno.estado] || 'bg-slate-100 text-slate-700'}`}>{turno.estado}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {turno.estado !== 'Cancelado' &&
          <button type="button" onClick={() => handleCancelTurno(turno)}
            className="flex items-center gap-1.5 rounded-2xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition">
            {icons.trash} Cancelar
          </button>
        }
        {turno.estado === 'Pendiente' && turno.usuario_id === user?.uid &&
          <button type="button" onClick={() => handleReschedule(turno)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-farmacia hover:text-farmacia transition">
            Reprogramar
          </button>
        }
        {(isAdmin || isCreador) && turno.estado === 'Pendiente' &&
          <button type="button" onClick={() => handleConfirmTurno(turno)}
            className="flex items-center gap-1.5 rounded-2xl bg-farmacia px-4 py-2 text-xs font-semibold text-white hover:bg-farmacia/90 transition">
            {icons.check} Confirmar
          </button>
        }
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  PANEL CREADOR
  // ─────────────────────────────────────────────────────
  const renderCreadorPanel = () => (
    <div className="space-y-6 fade-in-up">
      <div className="creator-header rounded-[32px] px-8 py-6 shadow-suave">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Panel del Creador</p>
            <h1 className="mt-2 text-2xl font-semibold">Centro Oftalmológico</h1>
            <p className="mt-1 text-sm opacity-70">Control total del sistema</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-white/20 px-4 py-2 text-sm font-semibold">
              {icons.crown} Creador
            </span>
            <button onClick={handleLogout}
              className="flex items-center gap-2 rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition">
              {icons.logout} Salir
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-6 flex gap-4 border-t border-white/20 pt-4">
          {[['turnos','Todos los Turnos'],['usuarios','Gestión de Usuarios']].map(([key,label]) => (
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
            <button onClick={() => fetchAllTurnos()} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-farmacia hover:text-farmacia transition">
              Actualizar
            </button>
          </div>
          {allTurnos.length === 0
            ? <p className="rounded-3xl border border-dashed border-slate-300 bg-fondo p-6 text-sm text-slate-500">No hay turnos registrados todavía.</p>
            : <div className="space-y-3">{allTurnos.map(t => <TurnoCard key={t.id} turno={t} showUser />)}</div>
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
                  {u.id !== user?.uid && (
                    <select value={u.rol}
                      onChange={e => handleChangeUserRol(u.id, e.target.value)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-farmacia">
                      <option value="cliente">Cliente</option>
                      <option value="administrador">Administrador</option>
                      <option value="creador">Creador</option>
                    </select>
                  )}
                  {u.id === user?.uid && <span className="text-xs text-slate-400">(tu cuenta)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  PANEL ADMINISTRADOR / CLIENTE (dashboard)
  // ─────────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <header className="rounded-[32px] bg-white px-6 py-6 shadow-suave sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-farmacia">Centro Oftalmológico</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Hola, {perfil?.nombre || user?.email}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? 'Podés confirmar y gestionar todos los turnos.' : 'Reservá, cancelá y reprogramá tus turnos.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-2xl px-4 py-2 text-sm font-semibold ${rolBadge[rol]}`}>
              {rolLabels[rol]}
            </span>
            <button onClick={handleLogout}
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
              <button type="button" onClick={() => { setEditingTurno(null); setBookingStep('service'); setBookingData({ servicio: services[0].id, fecha:'', horario:'' }); }}
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
                {renderCalendar()}
              </div>
            )}
            {/* Paso 3 - horario */}
            {bookingStep !== 'service' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">03. Reservá el horario</p>
                {bookingData.fecha ? renderTimeGrid() : <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Seleccioná una fecha primero.</p>}
              </div>
            )}
            {/* Paso 4 - resumen */}
            {bookingStep === 'summary' && renderSummary()}
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
          <button onClick={() => { fetchMyTurnos(); if (isAdmin) fetchAllTurnos(); }}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-farmacia hover:text-farmacia transition">
            Actualizar
          </button>
        </div>
        {(isAdmin ? allTurnos : myTurnos).length === 0
          ? <p className="rounded-3xl border border-dashed border-slate-300 bg-fondo p-6 text-sm text-slate-500">No hay turnos registrados.</p>
          : <div className="space-y-3">{(isAdmin ? allTurnos : myTurnos).map(t => <TurnoCard key={t.id} turno={t} showUser={isAdmin} />)}</div>
        }
      </section>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  FORMULARIOS DE AUTH
  // ─────────────────────────────────────────────────────
  const RoleButton = ({ value, current, onChange, label, desc, icon }) => (
    <button type="button" onClick={() => onChange(value)}
      className={`rounded-2xl border p-4 text-left transition ${current === value ? 'border-farmacia bg-farmacia/10' : 'border-slate-200 bg-white hover:border-farmacia/50'}`}>
      <div className="flex items-center gap-2">
        <span className={`text-lg ${current === value ? 'text-farmacia' : 'text-slate-400'}`}>{icon}</span>
        <span className={`text-sm font-semibold ${current === value ? 'text-farmacia' : 'text-slate-700'}`}>{label}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </button>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-5">
      <InputField label="Email" name="email" type="email" value={loginData.email} placeholder="usuario@correo.com" icon={icons.email} error={errors.email}
        onChange={e => { setLoginData(p=>({...p,email:e.target.value})); setErrors(p=>({...p,email:validate.email(e.target.value)})); }} />
      <InputField label="Contraseña" name="password" type="password" value={loginData.password} placeholder="Mínimo 8 caracteres" icon={icons.lock} error={errors.password}
        onChange={e => { setLoginData(p=>({...p,password:e.target.value})); setErrors(p=>({...p,password:validate.password(e.target.value)})); }} />
      <button type="button" onClick={() => setAuthTab('reset')} className="text-sm font-semibold text-slate-500 hover:text-farmacia transition">
        ¿Olvidaste tu contraseña?
      </button>
      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-farmacia px-5 py-3 text-sm font-semibold text-white transition hover:bg-farmacia/90 disabled:opacity-60">
        {loading ? 'Ingresando…' : 'Ingresar'}
      </button>
      <p className="text-center text-sm text-slate-500">
        ¿No tenés cuenta?{' '}
        <button type="button" onClick={() => setAuthTab('register')} className="font-semibold text-farmacia hover:underline">Crear cuenta</button>
      </p>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Nombre" name="nombre" value={regData.nombre} placeholder="Juan" icon={icons.user} error={errors.nombre}
          onChange={e => { setRegData(p=>({...p,nombre:e.target.value})); setErrors(p=>({...p,nombre:validate.nombre(e.target.value)})); }} />
        <InputField label="Apellido" name="apellido" value={regData.apellido} placeholder="Pérez" icon={icons.user} error={errors.apellido}
          onChange={e => { setRegData(p=>({...p,apellido:e.target.value})); setErrors(p=>({...p,apellido:validate.apellido(e.target.value)})); }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="DNI" name="dni" value={regData.dni} placeholder="12345678" icon={icons.user} error={errors.dni}
          onChange={e => { setRegData(p=>({...p,dni:e.target.value})); setErrors(p=>({...p,dni:validate.dni(e.target.value)})); }} />
        <InputField label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={regData.fechaNacimiento} placeholder="" icon={icons.calendar} error={errors.fechaNacimiento}
          onChange={e => { setRegData(p=>({...p,fechaNacimiento:e.target.value})); setErrors(p=>({...p,fechaNacimiento:validate.fechaNacimiento(e.target.value)})); }} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Teléfono" name="telefono" value={regData.telefono} placeholder="1123456789" icon={icons.phone} error={errors.telefono}
          onChange={e => { setRegData(p=>({...p,telefono:e.target.value})); setErrors(p=>({...p,telefono:validate.telefono(e.target.value)})); }} />
        <InputField label="Email" name="email" type="email" value={regData.email} placeholder="usuario@correo.com" icon={icons.email} error={errors.email}
          onChange={e => { setRegData(p=>({...p,email:e.target.value})); setErrors(p=>({...p,email:validate.email(e.target.value)})); }} />
      </div>
      <InputField label="Contraseña" name="password" type="password" value={regData.password} placeholder="Mínimo 8 caracteres" icon={icons.lock} error={errors.password}
        onChange={e => { setRegData(p=>({...p,password:e.target.value})); setErrors(p=>({...p,password:validate.password(e.target.value)})); }} />

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

      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-farmacia px-5 py-3 text-sm font-semibold text-white transition hover:bg-farmacia/90 disabled:opacity-60">
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
      <p className="text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <button type="button" onClick={() => setAuthTab('login')} className="font-semibold text-farmacia hover:underline">Ingresar</button>
      </p>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={handleReset} className="space-y-5">
      <p className="text-sm text-slate-600">Te enviaremos un enlace para restablecer tu contraseña.</p>
      <InputField label="Email" name="email" type="email" value={resetEmail} placeholder="usuario@correo.com" icon={icons.email} error={errors.email}
        onChange={e => { setResetEmail(e.target.value); setErrors(p=>({...p,email:validate.email(e.target.value)})); }} />
      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-farmacia px-5 py-3 text-sm font-semibold text-white transition hover:bg-farmacia/90 disabled:opacity-60">
        {loading ? 'Enviando…' : 'Enviar enlace'}
      </button>
      <p className="text-center text-sm text-slate-500">
        <button type="button" onClick={() => setAuthTab('login')} className="font-semibold text-farmacia hover:underline">Volver al ingreso</button>
      </p>
    </form>
  );

  // ─────────────────────────────────────────────────────
  //  PANTALLA DE AUTH
  // ─────────────────────────────────────────────────────
  const renderAuth = () => (
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
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-farmacia/10 text-sm text-farmacia font-bold">👤</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Cliente</p>
                <p className="text-xs text-slate-500">Reserva, cancela y reprograma sus propios turnos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold">🛡️</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Administrador</p>
                <p className="text-xs text-slate-500">Confirma y gestiona todos los turnos del sistema.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold">👑</span>
              <div>
                <p className="text-sm font-semibold text-slate-700">Creador</p>
                <p className="text-xs text-slate-500">Acceso total: gestión de usuarios, roles y todos los turnos.</p>
              </div>
            </div>
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
              {[['login','Ingresar'],['register','Registrarse']].map(([tab,label]) => (
                <button key={tab} type="button" onClick={() => setAuthTab(tab)}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${authTab===tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {authTab==='login'    && renderLoginForm()}
          {authTab==='register' && renderRegisterForm()}
          {authTab==='reset'    && renderResetForm()}
        </section>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  LOADING
  // ─────────────────────────────────────────────────────
  if (view === 'loading') return (
    <div className="flex min-h-screen items-center justify-center bg-fondo">
      <div className="text-center loading-pulse">
        <p className="text-2xl font-semibold text-farmacia">Centro Oftalmológico</p>
        <p className="mt-2 text-sm text-slate-500">Iniciando sesión…</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  //  RENDER PRINCIPAL
  // ─────────────────────────────────────────────────────
  return (
    <>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({msg:'',type:'info'})} />
      {view === 'auth' && renderAuth()}
      {view === 'dashboard' && user && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {isCreador ? renderCreadorPanel() : renderDashboard()}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
//  TRADUCCIÓN DE ERRORES FIREBASE
// ─────────────────────────────────────────────────────────
function traducirError(code) {
  const map = {
    'auth/user-not-found':       'No existe una cuenta con ese email.',
    'auth/wrong-password':       'Contraseña incorrecta.',
    'auth/email-already-in-use': 'Ese email ya está registrado.',
    'auth/invalid-email':        'El formato del email no es válido.',
    'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests':    'Demasiados intentos. Intentá más tarde.',
    'auth/network-request-failed':'Error de red. Verificá tu conexión.',
    'auth/invalid-credential':   'Email o contraseña incorrectos.'
  };
  return map[code] || 'Ocurrió un error inesperado.';
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);