const form = document.getElementById('bookingForm');
const toast = document.getElementById('toast');
const savedTurnosContainer = document.getElementById('savedTurnos');
const availabilityMessage = document.getElementById('availabilityMessage');
const dateInput = document.getElementById('dateInput');
const timeSelect = document.getElementById('timeSelect');
const calendarContainer = document.getElementById('calendarGrid');

const STORAGE_KEY = 'turnosCarniceriaInterior';
const SCHEDULE_KEY = 'agendaCarniceriaInterior';
const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
const MAX_PER_SLOT = 2;

const FIREBASE_CONFIG = {
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROYECTO',
  storageBucket: 'TU_PROYECTO.appspot.com',
  messagingSenderId: 'TU_MESSAGING_SENDER_ID',
  appId: 'TU_APP_ID',
};

let db = null;

window.addEventListener('DOMContentLoaded', () => {
  initializeSchedule();
  initFirebase();
  setDateLimits();
  updateTimeOptions();
  renderCalendar();
  updateBookingSummary();
  renderSavedTurnos();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  const turno = {
    id: Date.now(),
    name: formData.get('name').toString().trim(),
    phone: formData.get('phone').toString().trim(),
    location: formData.get('location').toString().trim(),
    cut: formData.get('cut').toString(),
    date: formData.get('date').toString(),
    time: formData.get('time').toString(),
    quantity: formData.get('quantity').toString().trim(),
    notes: formData.get('notes').toString().trim(),
    createdAt: new Date().toISOString(),
  };

  const scheduleEntry = getScheduleEntry(turno.date);

  if (!turno.name || !turno.phone || !turno.location || !turno.cut || !turno.date || !turno.time) {
    showToast('Completá los campos obligatorios para reservar.');
    return;
  }

  if (!scheduleEntry || scheduleEntry.closed || isDateFullyBooked(scheduleEntry)) {
    showToast('Esa fecha ya no tiene turnos disponibles. Probá con otra fecha.');
    return;
  }

  const booked = scheduleEntry.slots[turno.time] ?? MAX_PER_SLOT;
  if (booked >= MAX_PER_SLOT) {
    showToast('Ese horario ya está completo. Elegí otro.');
    return;
  }

  saveTurno(turno);
  addBookingToSchedule(turno.date, turno.time);
  form.reset();
  setTimeout(() => {
    updateTimeOptions();
  }, 50);
  renderSavedTurnos();
  showToast('Turno guardado. Te contactaremos por WhatsApp.');
  saveToFirebase(turno);
});

dateInput?.addEventListener('change', updateTimeOptions);
timeSelect?.addEventListener('change', updateBookingSummary);
const cutSelect = form.querySelector('select[name="cut"]');
cutSelect?.addEventListener('change', updateBookingSummary);

function initFirebase() {
  try {
    if (window.firebase && firebase.firestore) {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.firestore();
      console.log('Firebase inicializado.');
    }
  } catch (error) {
    console.warn('Firebase no está configurado o no pudo iniciarse.', error);
  }
}

function setDateLimits() {
  const today = new Date();
  const minDate = today.toISOString().slice(0, 10);
  if (dateInput) {
    dateInput.min = minDate;
    if (!dateInput.value) {
      dateInput.value = minDate;
    }
  }
}

function initializeSchedule() {
  if (localStorage.getItem(SCHEDULE_KEY)) return;

  const schedule = {};
  const today = new Date();

  for (let day = 0; day < 14; day += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + day);
    const isoDate = date.toISOString().slice(0, 10);
    const weekday = date.getDay();
    const closed = weekday === 0 || weekday === 6;

    schedule[isoDate] = {
      closed,
      slots: TIME_SLOTS.reduce((acc, slot) => {
        let count = 0;
        if (closed) {
          count = MAX_PER_SLOT;
        } else if ([2, 5, 9].includes(day)) {
          count = MAX_PER_SLOT;
        } else {
          count = Math.floor(Math.random() * (MAX_PER_SLOT + 1));
        }

        acc[slot] = count;
        return acc;
      }, {}),
    };
  }

  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

function getSchedule() {
  const raw = localStorage.getItem(SCHEDULE_KEY);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('No se pudo cargar la agenda:', error);
    return {};
  }
}

function getScheduleEntry(date) {
  const schedule = getSchedule();
  return schedule[date];
}

function addBookingToSchedule(date, time) {
  const schedule = getSchedule();
  if (!schedule[date]) return;

  schedule[date].slots[time] = Math.min(MAX_PER_SLOT, (schedule[date].slots[time] || 0) + 1);
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
}

function updateTimeOptions() {
  const selectedDate = dateInput?.value;
  const scheduleEntry = selectedDate ? getScheduleEntry(selectedDate) : null;

  if (!timeSelect) return;
  timeSelect.innerHTML = '<option value="">Seleccioná un horario</option>';

  if (!selectedDate || !scheduleEntry) {
    availabilityMessage.textContent = 'Elegí una fecha dentro de los próximos 14 días.';
    updateBookingSummary();
    return;
  }

  if (scheduleEntry.closed || isDateFullyBooked(scheduleEntry)) {
    availabilityMessage.textContent = 'Ese día está completo o cerrado. Elegí otro día.';
    updateBookingSummary();
    return;
  }

  availabilityMessage.textContent = 'Horarios disponibles para esa fecha. Algunos ya están ocupados.';

  TIME_SLOTS.forEach((slot) => {
    const booked = scheduleEntry.slots[slot] ?? MAX_PER_SLOT;
    const available = Math.max(0, MAX_PER_SLOT - booked);
    const option = document.createElement('option');
    option.value = slot;
    option.textContent = `${slot} (${available} cupo${available === 1 ? '' : 's'})`;
    option.disabled = available === 0;
    timeSelect.appendChild(option);
  });

  renderCalendar();
}

function renderCalendar() {
  if (!calendarContainer) return;
  const schedule = getSchedule();
  const dates = Object.keys(schedule).sort();

  calendarContainer.innerHTML = '';

  dates.forEach((date) => {
    const entry = schedule[date];
    const availableSlots = TIME_SLOTS.reduce((sum, slot) => {
      const booked = entry.slots[slot] ?? MAX_PER_SLOT;
      return sum + Math.max(0, MAX_PER_SLOT - booked);
    }, 0);

    let status = 'available';

    if (entry.closed) {
      status = 'closed';
    } else if (isDateFullyBooked(entry)) {
      status = 'full';
    } else if (availableSlots <= 2) {
      status = 'limited';
    }

    const dateObj = new Date(date + 'T00:00');
    const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'short' });
    const dayNumber = dateObj.toLocaleDateString('es-AR', { day: '2-digit' });

    const item = document.createElement('button');
    item.type = 'button';
    item.className = `calendar-day ${status}`;
    if (date === dateInput?.value) {
      item.classList.add('active');
    }
    item.innerHTML = `
      <strong>${dayName}</strong>
      <span>${dayNumber}</span>
    `;
    item.addEventListener('click', () => {
      if (status !== 'closed' && dateInput) {
        dateInput.value = date;
        updateTimeOptions();
        renderCalendar();
      }
    });

    calendarContainer.appendChild(item);
  });
}

function updateBookingSummary() {
  if (!bookingSummary) return;
  const selectedDate = dateInput?.value;
  const selectedTime = timeSelect?.value;
  const cut = form.querySelector('select[name="cut"]')?.value;
  const scheduleEntry = selectedDate ? getScheduleEntry(selectedDate) : null;

  if (!selectedDate) {
    bookingSummary.innerHTML = '<p><strong>Resumen:</strong> Seleccioná un día para ver disponibilidad.</p>';
    return;
  }

  if (!scheduleEntry || scheduleEntry.closed || isDateFullyBooked(scheduleEntry)) {
    bookingSummary.innerHTML = '<p><strong>Resumen:</strong> Ese día está completo o cerrado. Elegí otro día.</p>';
    return;
  }

  const availableSlots = TIME_SLOTS.reduce((sum, slot) => {
    const booked = scheduleEntry.slots[slot] ?? MAX_PER_SLOT;
    return sum + Math.max(0, MAX_PER_SLOT - booked);
  }, 0);

  const message = `
    <p><strong>Resumen:</strong> ${availableSlots} cupo${availableSlots === 1 ? '' : 's'} disponibles el ${formatDate(selectedDate)}.</p>
    <p>${selectedTime ? `Horario elegido: ${selectedTime}.` : 'Elegí un horario en el menú desplegable.'}</p>
    ${cut ? `<p>Corte seleccionado: ${cut}.</p>` : '<p>Elegí tu corte para completar el turno.</p>'}
  `;

  bookingSummary.innerHTML = message;
}

function isDateFullyBooked(scheduleEntry) {
  return TIME_SLOTS.every((slot) => (scheduleEntry.slots[slot] ?? MAX_PER_SLOT) >= MAX_PER_SLOT);
}

function getSavedTurnos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error al leer turnos guardados:', error);
    return [];
  }
}

function saveTurno(turno) {
  const turnos = getSavedTurnos();
  turnos.push(turno);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(turnos));
}

function saveToFirebase(turno) {
  if (!db) return;

  db.collection('turnos')
    .add(turno)
    .then(() => console.log('Turno guardado en Firebase.'))
    .catch((error) => console.warn('No se pudo guardar en Firebase:', error));
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

function renderSavedTurnos() {
  const turnos = getSavedTurnos();
  if (!savedTurnosContainer) return;

  if (turnos.length === 0) {
    savedTurnosContainer.innerHTML = '<p class="empty-note">No hay turnos guardados todavía.</p>';
    return;
  }

  savedTurnosContainer.innerHTML = turnos
    .sort((a, b) => b.id - a.id)
    .map((turno) => {
      return `
        <div class="turno-card">
          <div class="turno-card-header">
            <strong>Turno reservado</strong>
            <span>${formatDate(turno.date)} • ${turno.time}</span>
          </div>
          <p><strong>Localidad:</strong> ${turno.location}</p>
          <p><strong>Corte:</strong> ${turno.cut}</p>
          ${turno.quantity ? `<p><strong>Cantidad:</strong> ${turno.quantity}</p>` : ''}
          ${turno.notes ? `<p><strong>Nota:</strong> ${turno.notes}</p>` : ''}
        </div>
      `;
    })
    .join('');
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => {
    toast.classList.remove('show');
  }, 3600);
}
