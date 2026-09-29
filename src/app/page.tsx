import Link from "next/link";
import { Activity, ShieldAlert, Map, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-blue-600 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            SAFE RACE
          </h1>
          <div className="space-x-4">
            <Link href="/login" className="hover:text-blue-200 transition">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold hover:bg-slate-100 transition">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-6">
          La seguridad en ruta,<br/>
          <span className="text-blue-600">Llevada al siguiente nivel.</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-12">
          Plataforma integral para organizadores de maratones y carreras de trail. 
          Rastreo GPS en tiempo real, alertas SOS, escaneo QR y zonas de tolerancia.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Map className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Live Tracking</h3>
            <p className="text-slate-500 text-sm">Rastrea la ubicación de cada participante en tiempo real desde el Dashboard del Organizador.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Alertas SOS</h3>
            <p className="text-slate-500 text-sm">El motor de alertas (Turf.js) calcula desvíos de ruta e inactividad de forma automática.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Gestión Total</h3>
            <p className="text-slate-500 text-sm">Inscripciones, escaneo de credenciales QR y múltiples roles de organización en un solo lugar.</p>
          </div>
        </div>

        <div className="mt-16">
          <Link href="/organizer" className="text-slate-500 underline hover:text-slate-800">
            Ir al Dashboard de Organizador
          </Link>
        </div>
      </main>
    </div>
  );
}
