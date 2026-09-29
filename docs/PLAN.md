# SAFE RACE - Plan de Implementación por Fases

## Fase 1: Inicialización y Documentación
- [x] Analizar requerimientos.
- [x] Inspeccionar repositorio.
- [x] Crear documentación (PRODUCT_REQUIREMENTS.md, ARCHITECTURE.md, DATABASE.md).
- [x] Inicializar proyecto Next.js con Tailwind y TypeScript.
- [x] Configurar herramientas de calidad (Lint, Vitest).
- [x] Inicializar dependencias clave (Supabase, Zod, React Hook Form, Leaflet, Turf.js, librerías QR).

## Fase 2: Configuración de Base de Datos y Autenticación
- [x] Crear migración inicial de Supabase con las 14 tablas, FK, constraints y RLS.
- [x] Configurar cliente de Supabase (SSR).
- [x] Implementar flujos de Auth (Registro, Login, Recuperación).
- [x] Crear Layouts y Navbar (Participante, Organizador).

## Fase 3: Gestión de Eventos y Organización (Organizador)
- [x] CRUD de Eventos (Crear evento, configurar parámetros).
- [x] Constructor de Ruta GPS (Mapa interactivo con Leaflet).
- [x] Configuración del Evento (distancia, tiempos de tolerancia, etc.).

## Fase 4: Flujo de Participante e Inscripción
- [x] Pantalla pública del Evento.
- [x] Proceso de inscripción (Solicitar).
- [x] Dashboard Organizador: Gestión de Solicitudes (Aprobar, Rechazar).
- [x] Generación de Credencial QR (Participante aprobado).

## Fase 5: Check-in y Tracking GPS (Live)
- [x] Escáner QR para Organizador (Check-in, Partida).
- [x] Pantalla activa de carrera para Participante (Tracking GPS en tiempo real).
- [x] Mapa en vivo para Organizador (Recepción de posiciones, Realtime).

## Fase 6: Sistema de Alertas
- [x] Botón SOS (Participante).
- [x] Motor de evaluación de alertas (Desvío, Estacionario, Sin GPS) - Backend/Endpoint periódico.
- [x] Dashboard de Alertas (Organizador - Reconocer, Asignar, Resolver).

## Fase 7: Meta y Cierre Seguro
- [x] Simulador de cruce de meta (Organizador).
- [x] Consola de cierre seguro (SAFE).
- [x] Historial de estados (Trazabilidad).

## Fase 8: Demostración y Pulido
- [x] Modo Demostración (Simulador de roles y movimientos).
- [x] Script de seed para datos demo.
- [x] Testing, linting, typecheck.
- [x] Guía de Demo y Reporte Final.
