import axios from 'axios';

export async function getDistanceMatrix(coords) {
  if (coords.length < 2) return [[0]];

  const lngLatPairs = coords.map(c => `${c.lng},${c.lat}`).join(';');
  const url = `https://router.project-osrm.org/table/v1/driving/${lngLatPairs}`;

  const response = await axios.get(url, {
    params: { annotations: 'duration' },
    timeout: 30000,
  });

  return response.data.durations;
}

export function convertDuration(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h${m}` : `${h}h`;
}
