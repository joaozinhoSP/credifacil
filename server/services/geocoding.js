import axios from 'axios';

export async function geocodeAddress(address, prisma) {
  const normalized = address.toLowerCase().trim().replace(/\s+/g, ' ');

  const cached = await prisma.addressCache.findUnique({ where: { address: normalized } });
  if (cached) {
    return { lat: cached.lat, lng: cached.lng };
  }

  const url = 'https://nominatim.openstreetmap.org/search';
  const params = {
    q: address,
    format: 'json',
    limit: 1,
  };

  const response = await axios.get(url, {
    params,
    headers: { 'User-Agent': 'RoteirizadorSaaS/1.0' },
    timeout: 10000,
  });

  if (!response.data || response.data.length === 0) {
    throw new Error(`Endereço não encontrado: ${address}`);
  }

  const { lat, lon } = response.data[0];
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lon);

  await prisma.addressCache.create({
    data: { address: normalized, lat: latNum, lng: lngNum },
  });

  return { lat: latNum, lng: lngNum };
}

export async function geocodeMultiple(addresses, prisma) {
  const results = [];
  for (const addr of addresses) {
    const result = await geocodeAddress(addr, prisma);
    results.push(result);
  }
  return results;
}
