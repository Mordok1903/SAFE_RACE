# SAFE RACE - Demo Guide

## Preparación de la Demostración

Para demostrar el sistema con éxito, sigue estos pasos:

1. **Crear Organización y Evento**:
   - Ingresa como organizador (o regístrate si no tienes cuenta).
   - Ve al menú Organizador.
   - Crea un nuevo evento, configurando la ruta GPS usando el mapa interactivo.
   - Publica el evento. Copia el link público del evento (ej. `/race/maraton-10k`).

2. **Inscripción (Rol: Participante)**:
   - Abre una ventana en Modo Incógnito.
   - Entra al link del evento.
   - Inicia sesión (o regístrate como corredor).
   - Haz clic en "Inscribirme".
   - Tu estado será `PENDING`.

3. **Aprobación (Rol: Organizador)**:
   - En la ventana de organizador, ve a la página del evento, sección "Solicitudes".
   - Aprueba al participante. Esto generará el código y el código QR.

4. **Check-in y Partida (Rol: Organizador / Lector QR)**:
   - En el dispositivo móvil del organizador, abre la herramienta "Escáner QR".
   - El participante muestra su credencial QR en su celular.
   - El organizador escanea el QR -> Registra Check-in.
   - Escanea el QR por segunda vez -> Marca Partida (estado cambia a `STARTED` y luego `RACING`).

5. **Tracking GPS (Rol: Participante)**:
   - El participante, tras la partida, abre la vista "Carrera Activa" (`/app/registrations/[id]/race`).
   - El navegador pedirá permisos de GPS. Acéptalos.
   - El sistema empezará a emitir coordenadas.

6. **Dashboard y Mapa en Vivo (Rol: Organizador)**:
   - El organizador abre el "Mapa en Vivo" del evento.
   - Verá la ruta, el corredor y su movimiento en tiempo real.

7. **Alerta de SOS (Rol: Participante)**:
   - El participante presiona el botón SOS, elige motivo "Lesión" y confirma.
   - El organizador recibe la alerta visual en el Dashboard inmediatamente.
   - El organizador reconoce, asigna y resuelve la alerta.

8. **Simulación de Cierre de Meta**:
   - El organizador entra a "Meta Simulada".
   - Elige al participante activo y pulsa "Simular Cruce de Meta".
   - Confirma la llegada. El estado del participante pasa a `FINISHED`.

9. **Cierre Seguro (SAFE)**:
   - El organizador revisa el participante. Verifica que no haya alertas pendientes.
   - Confirma el "Cierre Seguro".
   - El estado cambia a `SAFE`.

## Herramientas de Desarrollo
Si estás en entorno local, puedes acceder a la ruta oculta `/organizer/events/[id]/demo` para inyectar posiciones GPS y alertas simuladas sin necesidad de moverte físicamente.
