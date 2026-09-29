import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as turf from "@turf/turf";

// This would typically be a cron job or background worker.
// For the MVP, it's an API route that can be called periodically from the client.

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();
    if (!event_id) return NextResponse.json({ error: "event_id is required" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS for backend worker
    );

    // 1. Obtener config del evento
    const { data: event } = await supabase.from('events').select('*').eq('id', event_id).single();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    // 2. Obtener ruta
    const { data: route } = await supabase.from('event_routes').select('id').eq('event_id', event_id).eq('is_active', true).single();
    let polyline: any = null;
    if (route) {
      const { data: points } = await supabase.from('route_points').select('*').eq('route_id', route.id).order('sequence');
      if (points && points.length > 1) {
        polyline = turf.lineString(points.map(p => [p.longitude, p.latitude]));
      }
    }

    // 3. Obtener corredores activos
    const { data: racers } = await supabase.from('registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('race_status', 'RACING');

    if (!racers || racers.length === 0) {
      return NextResponse.json({ message: "No active racers" });
    }

    let evaluated = 0;
    let alertsCreated = 0;

    for (const racer of racers) {
      // Get last position
      const { data: pos } = await supabase.from('gps_positions')
        .select('*')
        .eq('registration_id', racer.id)
        .order('device_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!pos) continue;
      evaluated++;

      // Check NO GPS
      const now = new Date().getTime();
      const posTime = new Date(pos.device_timestamp).getTime();
      const diffSeconds = (now - posTime) / 1000;

      if (diffSeconds > event.no_gps_time_seconds) {
        alertsCreated += await ensureAlert(supabase, event_id, racer.id, 'NO_GPS', pos);
        continue; 
      }

      // Check DEVIATION
      if (polyline) {
        const pt = turf.point([pos.longitude, pos.latitude]);
        const distance = turf.pointToLineDistance(pt, polyline, { units: 'meters' });
        
        if (distance > event.route_tolerance_meters) {
          // Simplification for MVP: We alert immediately on deviation.
          // Ideally we check if they've been deviated for deviation_time_seconds
          alertsCreated += await ensureAlert(supabase, event_id, racer.id, 'DEVIATION', pos, `Desvío de ${Math.round(distance)}m`);
        }
      }
    }

    return NextResponse.json({ evaluated, alertsCreated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function ensureAlert(supabase: any, event_id: string, registration_id: string, type: string, pos: any, details?: string) {
  // Check if active alert of same type exists
  const { data: existing } = await supabase.from('alerts')
    .select('id')
    .eq('registration_id', registration_id)
    .eq('type', type)
    .in('status', ['CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'])
    .limit(1);

  if (!existing || existing.length === 0) {
    await supabase.from('alerts').insert({
      event_id,
      registration_id,
      type,
      latitude: pos.latitude,
      longitude: pos.longitude,
      details: details
    });
    return 1;
  }
  return 0;
}
