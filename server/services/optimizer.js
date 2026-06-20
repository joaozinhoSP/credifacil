function nearestNeighbor(distanceMatrix, startIndex, indices) {
  const n = indices.length;
  if (n === 0) return [];
  if (n === 1) return [indices[0]];

  const visited = new Set();
  const route = [];
  let current = startIndex;
  route.push(current);
  visited.add(current);

  while (route.length < n) {
    let nearest = null;
    let minDist = Infinity;
    for (const idx of indices) {
      if (!visited.has(idx)) {
        const dist = distanceMatrix[current][idx];
        if (dist < minDist) {
          minDist = dist;
          nearest = idx;
        }
      }
    }
    if (nearest === null) break;
    route.push(nearest);
    visited.add(nearest);
    current = nearest;
  }

  return route;
}

function twoOpt(route, distanceMatrix) {
  const n = route.length;
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const delta =
          distanceMatrix[route[i - 1]][route[i]] +
          distanceMatrix[route[k]][route[(k + 1) % n]] -
          (distanceMatrix[route[i - 1]][route[k]] +
            distanceMatrix[route[i]][route[(k + 1) % n]]);

        if (delta > 0) {
          route = [
            ...route.slice(0, i),
            ...route.slice(i, k + 1).reverse(),
            ...route.slice(k + 1),
          ];
          improved = true;
        }
      }
    }
  }

  return route;
}

function getWindowPenalty(timeWindow, arrivalMinutes, startMinutes) {
  if (timeWindow === 'morning') {
    const noon = 12 * 60;
    if (arrivalMinutes > noon) return (arrivalMinutes - noon) * 10;
  }
  if (timeWindow === 'afternoon') {
    const onePM = 13 * 60;
    if (arrivalMinutes < onePM) return (onePM - arrivalMinutes) * 10;
  }
  return 0;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function optimizeRoute(coords, distanceMatrix, timeWindows, startTime, avgServiceTime) {
  const n = coords.length;
  if (n === 0) return { route: [], times: [] };
  if (n === 1) {
    const arrivalTime = startTime;
    return {
      route: [0],
      times: [arrivalTime],
    };
  }

  const startMinutes = timeToMinutes(startTime);

  const morning = [];
  const afternoon = [];
  const none = [];

  for (let i = 0; i < n; i++) {
    if (timeWindows[i] === 'morning') morning.push(i);
    else if (timeWindows[i] === 'afternoon') afternoon.push(i);
    else none.push(i);
  }

  let fullRoute = [];

  if (morning.length > 0) {
    let route = nearestNeighbor(distanceMatrix, morning[0], morning);
    route = twoOpt(route, distanceMatrix);
    fullRoute.push(...route);
  }

  if (none.length > 0) {
    const startForNone = fullRoute.length > 0 ? fullRoute[fullRoute.length - 1] : none[0];
    let route = nearestNeighbor(distanceMatrix, startForNone, none);
    route = twoOpt(route, distanceMatrix);
    fullRoute.push(...route);
  }

  if (afternoon.length > 0) {
    const startForAfternoon = fullRoute.length > 0 ? fullRoute[fullRoute.length - 1] : afternoon[0];
    let route = nearestNeighbor(distanceMatrix, startForAfternoon, afternoon);
    route = twoOpt(route, distanceMatrix);
    fullRoute.push(...route);
  }

  let currentTime = startMinutes;
  const arrivalTimes = [];

  for (let i = 0; i < fullRoute.length; i++) {
    const visitIdx = fullRoute[i];
    if (i === 0) {
      const travelTime = distanceMatrix[0][visitIdx] / 60;
      currentTime += travelTime;
    } else {
      const prevIdx = fullRoute[i - 1];
      const travelTime = distanceMatrix[prevIdx][visitIdx] / 60;
      currentTime += travelTime;
    }

    let penalty = getWindowPenalty(timeWindows[visitIdx], currentTime, startMinutes);
    const MAX_PENALTY_ITERATIONS = 50;
    let iterations = 0;
    while (penalty > 0 && iterations < MAX_PENALTY_ITERATIONS) {
      currentTime += penalty * 0.1;
      penalty = getWindowPenalty(timeWindows[visitIdx], currentTime, startMinutes);
      iterations++;
    }

    arrivalTimes.push(currentTime);

    currentTime += avgServiceTime;
  }

  return {
    route: fullRoute,
    times: arrivalTimes,
  };
}

export function calculateTotalDuration(distanceMatrix, route) {
  let total = 0;
  for (let i = 0; i < route.length; i++) {
    if (i === 0) {
      total += distanceMatrix[0][route[i]];
    } else {
      total += distanceMatrix[route[i - 1]][route[i]];
    }
  }
  return total;
}

export function minutesToTimeStr(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
