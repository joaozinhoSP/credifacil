import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapBounds({ coords }) {
  const map = useMap();
  if (coords.length > 0) {
    const bounds = L.latLngBounds(coords.map(c => [c.lat, c.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
  return null;
}

export default function RouteMap({ baseCoords, orderedVisits }) {
  if (!baseCoords || orderedVisits.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-400 text-sm">
        Mapa indisponível - coordenadas não carregadas
      </div>
    );
  }

  const allPoints = [
    { lat: baseCoords.lat, lng: baseCoords.lng, label: 'Minha base', isBase: true },
    ...orderedVisits.map(v => ({ lat: v.lat, lng: v.lng, label: v.name, arrivalTime: v.arrivalTime, isBase: false })),
  ];

  const validPoints = allPoints.filter(p => p.lat != null && p.lng != null);
  if (validPoints.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-400 text-sm">
        Mapa indisponível - coordenadas não carregadas
      </div>
    );
  }

  const polylinePositions = validPoints.map(p => [p.lat, p.lng]);
  const center = validPoints[0];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '400px' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds coords={validPoints} />

        <Polyline
          positions={polylinePositions}
          color="#2563eb"
          weight={3}
          opacity={0.7}
        />

        {validPoints.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]}>
            <Popup>
              <div className="text-sm">
                {p.isBase ? (
                  <p className="font-semibold text-blue-600">Ponto de partida</p>
                ) : (
                  <>
                    <p className="font-semibold">#{i} - {p.label}</p>
                    <p className="text-green-600 font-medium">Chegada: {p.arrivalTime}</p>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
