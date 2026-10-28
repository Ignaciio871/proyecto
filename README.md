# proyecto
a seguir durante el año con obregon

Sistema de turnos online para un centro oftalmológico, hecho con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS 4** y **Firebase** (Auth + Firestore).

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # completar con los datos del proyecto Firebase
npm run dev                  # http://localhost:3000
```

Otros scripts: `npm run build`, `npm start`, `npm run lint` (chequeo de tipos).

## Estructura

```
src/
  app/            layout, página principal y estilos globales (tema Tailwind)
  components/     Dashboard, CreadorPanel, TurnoCard, Toast, auth/, booking/
  hooks/          useAuth (sesión + perfil), useTurnos (carga y acciones de turnos)
  lib/            firebase, tipos, constantes, utilidades y validaciones
```

## Roles

- **Cliente**: reserva, cancela y reprograma sus propios turnos.
- **Administrador**: confirma y gestiona todos los turnos.
- **Creador**: panel completo + gestión de roles de usuarios.
