"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix para iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const runnerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/191/191204.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

const alertIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

export default function LiveMap({ participants, routePoints, alerts }: { participants: any[], routePoints: any[], alerts: any[] }) {
  const [center, setCenter] = useState<[number, number]>([-12.046374, -77.042793]) // Lima default

  useEffect(() => {
    if (routePoints.length > 0) {
      setCenter([routePoints[0].latitude, routePoints[0].longitude])
    } else if (participants.length > 0 && participants[0].lat) {
      setCenter([participants[0].lat, participants[0].lng])
    }
  }, [routePoints, participants])

  const polyline: [number, number][] = routePoints.map(p => [p.latitude, p.longitude])

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border shadow-sm">
      <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {polyline.length > 0 && (
          <Polyline positions={polyline} color="blue" weight={5} opacity={0.7} />
        )}

        {participants.map((p) => {
          if (!p.lat || !p.lng) return null;
          const hasAlert = alerts.some(a => a.registration_id === p.id)
          
          return (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={hasAlert ? alertIcon : runnerIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold">{p.name}</p>
                  <p className="text-sm text-slate-600">Código: {p.code}</p>
                  <p className="text-sm text-slate-600">Estado: {p.status}</p>
                  <p className="text-xs text-slate-400 mt-2">Última act: {new Date(p.timestamp).toLocaleTimeString()}</p>
                  {hasAlert && <p className="text-xs text-red-600 font-bold mt-1">¡TIENE ALERTAS!</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
