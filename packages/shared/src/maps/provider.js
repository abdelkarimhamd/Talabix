export function createMapsProvider(adapter) {
  return {
    searchPlaces(query) {
      return adapter.searchPlaces(query);
    },
    geocode(address) {
      return adapter.geocode(address);
    },
    reverseGeocode(latitude, longitude) {
      return adapter.reverseGeocode(latitude, longitude);
    },
    distanceEstimate(origin, destination) {
      return adapter.distanceEstimate(origin, destination);
    },
  };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function estimateDistanceMeters(origin, destination) {
  const earthRadius = 6371000;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const angle =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Math.round(2 * earthRadius * Math.asin(Math.sqrt(angle)));
}

export function buildGoogleMapsDirectionsUrl({
  destination,
  origin,
  mode = 'driving',
}) {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: mode,
  });

  if (origin) {
    params.set('origin', `${origin.latitude},${origin.longitude}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function formatDurationMinutes(durationMinutes) {
  return `${durationMinutes} min`;
}

const defaultPlaces = [
  {
    id: 'place-home-olaya',
    title: 'King Fahd Tower Lobby',
    label: 'Home',
    line_1: 'King Fahd Road',
    line_2: null,
    building: 'Tower A',
    landmark: 'North gate lobby desk',
    city: 'Riyadh',
    latitude: 24.716,
    longitude: 46.681,
  },
  {
    id: 'place-office-olaya',
    title: 'Olaya Office Hub',
    label: 'Office',
    line_1: 'Olaya Street',
    line_2: 'Gate 3',
    building: 'Business Plaza',
    landmark: 'Reception elevator bank',
    city: 'Riyadh',
    latitude: 24.7118,
    longitude: 46.6734,
  },
  {
    id: 'place-dq-villa',
    title: 'Diplomatic Quarter Villa',
    label: 'Parents',
    line_1: 'DQ Plaza',
    line_2: null,
    building: 'Villa 12',
    landmark: 'Palm court entrance',
    city: 'Riyadh',
    latitude: 24.6841,
    longitude: 46.6297,
  },
];

function stripSearchText(place) {
  const publicPlace = { ...place };
  delete publicPlace.search_text;

  return publicPlace;
}

export function createDemoMapsProvider({
  places = defaultPlaces,
  averageDrivingSpeedKph = 28,
  providerName = 'google-maps-demo',
} = {}) {
  const indexedPlaces = places.map((place) => ({
    ...place,
    search_text: [
      place.title,
      place.label,
      place.line_1,
      place.line_2,
      place.building,
      place.landmark,
      place.city,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }));
  const metersPerMinute = (averageDrivingSpeedKph * 1000) / 60;

  return createMapsProvider({
    async searchPlaces(query) {
      const normalizedQuery = query.trim().toLowerCase();

      if (normalizedQuery.length < 2) {
        return [];
      }

      return indexedPlaces
        .filter((place) => place.search_text.includes(normalizedQuery))
        .map(stripSearchText);
    },
    async geocode(address) {
      const query =
        typeof address === 'string'
          ? address
          : [address?.line_1, address?.building, address?.city].filter(Boolean).join(' ');
      const [match] = await this.searchPlaces(query);

      return match ?? null;
    },
    async reverseGeocode(latitude, longitude) {
      const [nearest] = indexedPlaces
        .slice()
        .sort(
          (left, right) =>
            estimateDistanceMeters(
              { latitude, longitude },
              { latitude: left.latitude, longitude: left.longitude }
            ) -
            estimateDistanceMeters(
              { latitude, longitude },
              { latitude: right.latitude, longitude: right.longitude }
            )
        );

      if (!nearest) {
        return null;
      }

      return stripSearchText(nearest);
    },
    async distanceEstimate(origin, destination) {
      const distanceMeters = estimateDistanceMeters(origin, destination);

      return {
        mode: 'driving',
        distance_meters: distanceMeters,
        duration_minutes: Math.max(1, Math.ceil(distanceMeters / metersPerMinute)),
        provider: providerName,
      };
    },
  });
}
