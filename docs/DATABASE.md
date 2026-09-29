# SAFE RACE - Database Documentation

## Tablas y Relaciones
Se utilizará PostgreSQL provisto por Supabase. Se crearán 14 tablas principales.

### 1. profiles
- Extiende `auth.users` 1:1.
- Guarda datos personales del participante (nombre, DNI, teléfono de contacto de emergencia).

### 2. organizations
- `id` (PK), `name`, `slug`, `created_by`.

### 3. organization_members
- Relación N:M entre `organizations` y `auth.users`.
- Roles: `OWNER`, `ORGANIZER`, `OPERATOR`, `RESPONDER`.

### 4. events
- Pertenece a `organization_id`.
- Configuraciones clave: `route_tolerance_meters`, `deviation_time_seconds`, `stationary_time_seconds`, `no_gps_time_seconds`.
- `status`: `DRAFT`, `PUBLISHED`, `REGISTRATION_OPEN`, `READY`, `ACTIVE`, `FINISHED`, `CANCELLED`.

### 5. event_routes
- Versiones de la ruta del evento. `is_active` indica la actual.

### 6. route_points
- Secuencia de coordenadas que forman la ruta de la carrera (Polyline). `latitude`, `longitude`, `sequence`.

### 7. registrations
- Relación entre `event_id` y `participant_id` (auth.users).
- **registration_status**: `PENDING`, `APPROVED`, `REJECTED`.
- **race_status**: `NOT_STARTED`, `REGISTERED`, `STARTED`, `RACING`, `FINISHED`, `WITHDRAWN`, `SAFE`.
- Identificador `participant_code` (ej. P001).

### 8. qr_credentials
- Token UUID opaco único para el participante en esa carrera. NO contiene datos personales.

### 9. qr_scans
- Registro de cada lectura de QR hecha por un organizador. Permite auditoría.

### 10. participant_status_history
- Log inmutable de cambios en el `race_status`. Documenta transiciones con actor y timestamp.

### 11. gps_positions
- Tabla de alto volumen (PK `bigint identity`). Registra coordenadas emitidas por corredores activos.

### 12. alerts
- `type`: SOS, DEVIATION, STATIONARY, NO_GPS.
- `status`: CREATED, ACKNOWLEDGED, ASSIGNED, IN_PROGRESS, RESOLVED.

### 13. alert_actions
- Historial de gestión de alertas.

### 14. finish_events
- Eventos de cruce de meta. `source`: `SIMULATOR`, `HARDWARE`, `MANUAL`.

## Row Level Security (RLS)
Se aplican políticas restrictivas. Los usuarios leen y modifican sólo lo propio, y los organizadores acceden sólo a los registros de sus organizaciones y eventos.
