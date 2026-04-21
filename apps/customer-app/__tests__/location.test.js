import { beforeEach, expect, jest } from '@jest/globals';

import { requestCurrentLocation } from '../src/location';

const mockExpoLocation = {
  Accuracy: {
    Balanced: 3,
  },
  getCurrentPositionAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
};

beforeEach(() => {
  mockExpoLocation.getCurrentPositionAsync.mockReset();
  mockExpoLocation.getForegroundPermissionsAsync.mockReset();
  mockExpoLocation.hasServicesEnabledAsync.mockReset();
  mockExpoLocation.requestForegroundPermissionsAsync.mockReset();

  mockExpoLocation.hasServicesEnabledAsync.mockResolvedValue(true);
  mockExpoLocation.getForegroundPermissionsAsync.mockResolvedValue({
    canAskAgain: true,
    status: 'undetermined',
  });
  mockExpoLocation.requestForegroundPermissionsAsync.mockResolvedValue({
    status: 'granted',
  });
  mockExpoLocation.getCurrentPositionAsync.mockResolvedValue({
    coords: {
      latitude: 24.774265,
      longitude: 46.738586,
    },
  });
});

describe('requestCurrentLocation', () => {
  it('requests foreground permission and returns current coordinates', async () => {
    await expect(requestCurrentLocation(mockExpoLocation)).resolves.toEqual({
      ok: true,
      latitude: 24.774265,
      longitude: 46.738586,
    });

    expect(
      mockExpoLocation.requestForegroundPermissionsAsync
    ).toHaveBeenCalledTimes(1);
    expect(mockExpoLocation.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: 3,
    });
  });

  it('does not ask again when foreground permission is denied permanently', async () => {
    mockExpoLocation.getForegroundPermissionsAsync.mockResolvedValueOnce({
      canAskAgain: false,
      status: 'denied',
    });

    await expect(requestCurrentLocation(mockExpoLocation)).resolves.toEqual({
      ok: false,
      reason: 'permission-denied',
    });

    expect(
      mockExpoLocation.requestForegroundPermissionsAsync
    ).not.toHaveBeenCalled();
    expect(mockExpoLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns unavailable when location services are disabled', async () => {
    mockExpoLocation.hasServicesEnabledAsync.mockResolvedValueOnce(false);

    await expect(requestCurrentLocation(mockExpoLocation)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });

    expect(mockExpoLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('returns unavailable when current position cannot be read', async () => {
    mockExpoLocation.getCurrentPositionAsync.mockRejectedValueOnce(
      new Error('GPS unavailable')
    );

    await expect(requestCurrentLocation(mockExpoLocation)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });
});
