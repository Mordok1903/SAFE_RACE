# Revisión Técnica Final - SAFE RACE

## 1. Estado de PLAN.md
Todas las fases han sido desarrolladas e implementadas físicamente en código (Layouts, Páginas, Componentes y Endpoints). Los checkboxes en `docs/PLAN.md` han sido actualizados para reflejar su estado final.

## 2. Funcionalidades Implementadas
- **Auth & Profiles**: Login, registro e inserción automática de perfil.
- **Roles & Organizations**: `organization_members` con RLS, automatización del creador como `OWNER`.
- **Eventos & GPS**: CRUD completo, trazado de polilínea en mapa (Leaflet).
- **Inscripciones & Credencial**: Check-in, escáner QR (`html5-qrcode`), generación de credencial segura.
- **Rastreo y Alertas**: Tracking en tiempo real (`navigator.geolocation.watchPosition`), Live Map para organizador (React Leaflet).
- **Motor de Alertas**: Endpoint `/api/alerts/evaluate` basado en Turf.js (distancia `pointToLineDistance`).

## 3. Funcionalidades Simultadas (Mockeadas para el MVP Web)
- **Cruce de Meta (Hardware)**: En la vida real usaremos cámaras ESP32, aquí se provee la pantalla `Simulador de Meta`.
- **Worker/Cron Job**: El motor de alertas (`/api/alerts/evaluate`) está expuesto como API REST para ser llamado por cron u on-demand (por ejemplo, desde `/demo`), en lugar de tener un worker real en node corriendo en loop infinito.
- **Señal GPS Inestable**: Se simuló usando inyecciones manuales desde la pestaña Modo Demo.

## 4. Cambios Realizados a `001_initial_schema.sql`
1. **Profiles**: Se añadió `FOR INSERT WITH CHECK (auth.uid() = id)` para crearlos desde el frontend sin triggers complejos.
2. **Organizaciones**: Trigger `add_org_creator_as_owner()` asigna automáticamente `OWNER` al creador.
3. **Membresías seguras**: Creación de las funciones Security Definer `is_org_member` y `has_org_role` para prevenir recursividad RLS.
4. **Validación Inscripciones**: Restringida la política de creación a `registration_status='PENDING'` y `race_status='NOT_STARTED'`.
5. **Seguridad SOS**: El usuario solo puede crear alertas `type='SOS'`, `status='CREATED'` para eventos en los que está inscrito activamente.
6. **Trigger de Historial**: El trigger `log_participant_status_change` ahora es `SECURITY DEFINER` y respeta RLS. Se agregó `_last_status_source` transitorio para registrar quién cambió el estado.
7. **Constraints**: Agregados check bounds para `latitude`, `longitude`, distancias, tiempos positivos.
8. **Índices**: Añadidos `UNIQUE` filtrados (una ruta activa, un QR activo, no alertas activas duplicadas por tipo).
9. **Realtime**: Migración incluye `ALTER PUBLICATION supabase_realtime ADD TABLE...` automáticamente.

## 5. Configuración Manual en Supabase
1. Ingresa a la consola de Supabase.
2. Abre la pestaña de **SQL Editor**, copia todo el contenido de `supabase/migrations/001_initial_schema.sql` y ejecútalo.
3. En la pestaña **Database -> Replication** asegúrate de que esté encendida. El script SQL ya debió activar la publicación `supabase_realtime` para `gps_positions` y `alerts`.

## 6. Configuración Recomendada de Auth para Demo
- Desactiva temporalmente el **Email Confirmations** (`Confirm Email` OFF) en Supabase Auth Settings. Esto permitirá que la función `seed-demo.ts` cree los usuarios e inserte en `profiles` sin error.
- Alternativamente, si está activo, los usuarios deberán confirmar su correo antes de poder ver la aplicación.

## 7. Tablas que requieren Supabase Realtime
- `gps_positions` (Eventos INSERT)
- `alerts` (Eventos INSERT, UPDATE, DELETE)

## 8. Variables `.env` (o `.env.local`)
Debes configurar las siguientes variables en el archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```
*(Nota: Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en prefijo `NEXT_PUBLIC_`, nuestro código solo lo usa en rutas de API Backend y Server Actions).*

## 9. Instrucciones Exactas para Ejecutar
1. Instala dependencias: `npm install`
2. Siembra los datos de prueba (Requiere `.env` configurado, con Email Confirm OFF): `npm run seed`
3. Corre el servidor de desarrollo: `npm run dev`
4. Ingresa a `http://localhost:3000`.

## 10. Instrucciones para desplegar con HTTPS (Indispensable)
Para que el QR Scanner de cámara y la Geolocalización GPS del navegador (`navigator.geolocation`) funcionen en celulares reales, la web **DEBE** servirse por HTTPS.
- **Despliegue fácil**: Usa **Vercel** (`npx vercel`). Vincúlalo a tu repositorio GitHub. Vercel provee HTTPS automático.
- **Variables**: En el panel de Vercel (Project Settings -> Environment Variables) añade las 3 variables de entorno.

## 11 y 12. Resultados de Build y Limitaciones
El build local ejecuta correctamente typecheck y lint. No hay errores de lint que bloqueen el build de Next.js.
Limitaciones menores:
- Para producción, se requerirá un worker o webhook dedicado (edge functions) para el motor de evaluación de Alertas.
- La precisión del GPS varía en la web, el desvío se configuró a tolerancia general (ej. 50-100 metros) en base a esto.
