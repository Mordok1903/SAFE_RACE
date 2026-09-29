# SAFE RACE - Architecture Document

## 1. Stack Tecnológico
- **Frontend / Backend**: Next.js (App Router, React). SSR y Server Actions para mutaciones.
- **Lenguaje**: TypeScript estricto.
- **Estilos**: Tailwind CSS, componentes responsivos (orientados a PWA/Móvil para participantes).
- **Base de Datos y Auth**: Supabase (PostgreSQL, Auth, Realtime para dashboard en vivo).
- **Mapas y GIS**: React Leaflet (OpenStreetMap) y Turf.js para cálculos de desviación de ruta y geofencing.
- **Códigos QR**: `react-qr-code` (generación) y `react-qr-reader` o `html5-qrcode` (lectura por cámara).
- **Formularios y Validación**: React Hook Form y Zod.
- **Testing**: Vitest.

## 2. Arquitectura de Datos y Estado
- **Supabase SSR**: Utilización del paquete oficial `@supabase/ssr` para autenticación y recuperación de datos iniciales en Server Components.
- **Estado de Cliente**: Hooks de React locales. La sincronización en vivo (`/live`) utilizará `supabase.channel()` para escuchar inserciones en `gps_positions` y cambios en `alerts`.

## 3. Motor de Alertas
- Para el MVP web, la evaluación se ejecutará en un endpoint periódico `/api/alerts/evaluate` o dentro del Dashboard del organizador mediante un hook (aunque se documentará que en producción esto iría a una Edge Function/Cron Job).
- **Evaluaciones**:
  - `SOS`: Creado directamente por el cliente del corredor.
  - `DEVIATION`: Turf.js calcula la distancia mínima de la posición actual a la `route_points` (Polyline). Si supera `route_tolerance_meters` por `deviation_time_seconds`, alerta.
  - `STATIONARY`: Distancia entre posiciones consecutivas es casi cero durante `stationary_time_seconds`.
  - `NO_GPS`: Tiempo desde `device_timestamp` o `received_at` supera `no_gps_time_seconds`.

## 4. Roles y Seguridad (RLS)
El modelo no asume roles globales. La autorización se basa en pertenencia a `organization_members`.
- RLS Políticas en Supabase garantizan que un corredor sólo vea su propio perfil y estado, y pueda insertar GPS a su ID.
- El organizador puede leer todos los datos de eventos pertenecientes a sus organizaciones.

## 5. Patrones de Diseño
- **Componentes Aislados**: UI separada de la lógica de negocio (hooks personalizados).
- **Simulación**: Aislamiento total de las funciones `finish_events` y `source=SIMULATOR`, previendo el futuro soporte de hardware IoT (MQTT, Webhooks).
