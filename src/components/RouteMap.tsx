"use client"
import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix para iconos
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const ClickHandler = ({ onClick }: { onClick: (latlng: any) => void }) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng)
    },
  })
  return null
}

export default function RouteMap({ points, onMapClick }: { points: {lat: number, lng: number}[], onMapClick: (ll: any) => void }) {
  const [center, setCenter] = useState<[number, number]>([-12.046374, -77.042793]) // Lima

  useEffect(() => {
    if (points.length > 0) {
      setCenter([points[0].lat, points[0].lng])
    }
  }, [points])

  const polyline: [number, number][] = points.map(p => [p.lat, p.lng])

  return (
    <div className="h-[600px] w-full">
      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <ClickHandler onClick={onMapClick} />

        {polyline.length > 0 && (
           <>
            {/* Tolerancia simulada (corredor visual) */}
            <Polyline positions={polyline} color="yellow" weight={30} opacity={0.3} />
            {/* Ruta principal */}
            <Polyline positions={polyline} color="blue" weight={5} opacity={0.8} />
           </>
        )}

        {points.length > 0 && <Marker position={[points[0].lat, points[0].lng]} icon={startIcon} />}
        {points.length > 1 && <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]} icon={endIcon} />}
        
      </MapContainer>
    </div>
  )
}
