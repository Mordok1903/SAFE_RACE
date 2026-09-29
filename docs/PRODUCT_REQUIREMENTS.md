# SAFE RACE - Product Requirements Document (PRD)

## 1. Visión del Producto
SAFE RACE es un sistema de trazabilidad y alertas de seguridad para competencias de running y maratones. Resuelve la incertidumbre del estado del corredor durante el trayecto, monitoreando su ubicación, desviaciones, o inactividad prolongada sin asumir un estado médico, sino un control administrativo del evento.

## 2. Usuarios y Roles
No se usa un rol global. Un usuario puede participar en una carrera y a la vez organizar otra, o pertenecer a una organización.
- **Participante**: Se inscribe a eventos, transmite su ubicación GPS, emite alertas (SOS).
- **Organizador (Owner/Organizer)**: Crea organizaciones y eventos, aprueba participantes, escanea QR de check-in, visualiza el dashboard en vivo, gestiona alertas, marca el cruce de meta y certifica el cierre seguro del evento (SAFE).

## 3. Funcionalidades del MVP
- **Autenticación (Supabase Auth)**: Registro, login, perfiles.
- **Flujo de Participante**: Inscripción, obtención de QR, visualización del estado, emisión de GPS y botón SOS.
- **Flujo de Organización**: Creación de eventos, configuración de ruta, aprobación de solicitudes.
- **Check-in con QR**: Uso de la cámara móvil para registrar llegada y partida.
- **Tracking GPS y Alertas (Live)**: Panel en tiempo real de corredores, alertas (SOS, desvío, estacionario, sin GPS).
- **Cierre del Participante**: Registro de meta (simulado) y confirmación de estado SAFE.
- **Modo Demostración**: Herramientas locales para simular GPS, alertas y meta.

## 4. Estructura de Rutas
**Participante:**
- `/` - Landing page
- `/login`, `/register`
- `/profile`
- `/race/[publicSlug]` - Información del evento público
- `/app/registrations` - Mis inscripciones
- `/app/registrations/[id]`
- `/app/registrations/[id]/qr` - Credencial QR
- `/app/registrations/[id]/race` - Carrera Activa (Tracking)

**Organizador:**
- `/organizer`
- `/organizer/setup`
- `/organizer/events`
- `/organizer/events/new`
- `/organizer/events/[id]`
- `/organizer/events/[id]/registrations`, `/participants`, `/route`, `/live`, `/alerts`, `/scanner`, `/finish`, `/settings`, `/demo` (sólo dev).

## 5. Limitaciones Conocidas del MVP
- La aplicación del participante debe permanecer abierta o en primer plano para emitir GPS continuamente (limitación del navegador móvil sin service workers avanzados).
- No integra hardware en la meta (simulado).
- No hay pasarela de pagos.
