import * as Location from 'expo-location';

const grantedStatus = 'granted';
const deniedStatus = 'denied';

function hasLocationMethods(locationModule) {
  return (
    typeof locationModule?.getCurrentPositionAsync === 'function' &&
    typeof locationModule?.requestForegroundPermissionsAsync === 'function'
  );
}

function hasValidCoordinates(position) {
  return (
    Number.isFinite(position?.coords?.latitude) &&
    Number.isFinite(position?.coords?.longitude)
  );
}

async function getForegroundPermission(locationModule) {
  if (typeof locationModule.getForegroundPermissionsAsync !== 'function') {
    return null;
  }

  return locationModule.getForegroundPermissionsAsync();
}

async function hasLocationServices(locationModule) {
  if (typeof locationModule.hasServicesEnabledAsync !== 'function') {
    return true;
  }

  return locationModule.hasServicesEnabledAsync();
}

export async function requestCurrentLocation(locationModule = Location) {
  if (!hasLocationMethods(locationModule)) {
    return {
      ok: false,
      reason: 'unavailable',
    };
  }

  try {
    const servicesEnabled = await hasLocationServices(locationModule);

    if (!servicesEnabled) {
      return {
        ok: false,
        reason: 'unavailable',
      };
    }

    let permission = await getForegroundPermission(locationModule);

    if (permission?.status !== grantedStatus) {
      if (
        permission?.status === deniedStatus &&
        permission.canAskAgain === false
      ) {
        return {
          ok: false,
          reason: 'permission-denied',
        };
      }

      permission = await locationModule.requestForegroundPermissionsAsync();
    }

    if (permission?.status !== grantedStatus) {
      return {
        ok: false,
        reason: 'permission-denied',
      };
    }

    const position = await locationModule.getCurrentPositionAsync({
      accuracy: locationModule.Accuracy?.Balanced,
    });

    if (!hasValidCoordinates(position)) {
      return {
        ok: false,
        reason: 'unavailable',
      };
    }

    return {
      ok: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return {
      ok: false,
      reason: 'unavailable',
    };
  }
}
