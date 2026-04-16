import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { afterEach, jest } from '@jest/globals';
import { RiderHomeScreen } from '../src/screens/RiderHomeScreen';
import { AssignmentsScreen } from '../src/screens/AssignmentsScreen';
import { DeliveryScreen } from '../src/screens/DeliveryScreen';
import { RiderEarningsScreen } from '../src/screens/RiderEarningsScreen';
import { RiderNotificationsScreen } from '../src/screens/RiderNotificationsScreen';
import { AppProviders } from '../src/providers/AppProviders';
import { resetRiderApiState } from '../src/rider-api';

function renderWithProviders(ui) {
  return render(<AppProviders>{ui}</AppProviders>);
}

afterEach(() => {
  cleanup();
  resetRiderApiState();
});

describe('rider app shell', () => {
  it('renders the rider delivery overview', async () => {
    renderWithProviders(<RiderHomeScreen />);

    expect(
      await screen.findByText(/delivery flow optimized for one active order at a time/i)
    ).toBeTruthy();
    expect(await screen.findByText(/sara al-qahtani/i)).toBeTruthy();
  });

  it('accepts an assignment from the rider queue', async () => {
    renderWithProviders(<AssignmentsScreen />);

    fireEvent.press(await screen.findByTestId('accept-assignment'));

    await waitFor(() => {
      expect(
        screen.getByText(/head to the merchant and confirm pickup next/i)
      ).toBeTruthy();
    });
  });

  it('renders rider notifications and marks unread items as read', async () => {
    renderWithProviders(<RiderNotificationsScreen />);

    expect(await screen.findByText(/new assignment ready/i)).toBeTruthy();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(screen.getByTestId('mark-rider-notification-802'));
    });

    await waitFor(() => {
      expect(screen.getByText(/marked support updated the drop-off as read/i)).toBeTruthy();
    });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(screen.getByTestId('toggle-rider-unread-only'));
    });

    await waitFor(() => {
      expect(screen.queryByText(/support added a note asking for a lobby desk handoff/i)).toBeNull();
    });
  });

  it('renders rider earnings summary and recent delivered orders', async () => {
    renderWithProviders(<RiderEarningsScreen />);

    expect(await screen.findByText(/earnings this period/i)).toBeTruthy();
    expect(await screen.findByText(/SAR 47.00/i)).toBeTruthy();
    expect(await screen.findByText(/3 delivered orders/i)).toBeTruthy();
    expect(await screen.findByText(/mama noura/i)).toBeTruthy();
  });

  it('completes the rider proof capture flow', async () => {
    const openExternalUrl = jest.fn(() => Promise.resolve());
    renderWithProviders(<DeliveryScreen openExternalUrl={openExternalUrl} />);

    fireEvent.press(await screen.findByTestId('open-pickup-navigation'));

    await waitFor(() => {
      expect(openExternalUrl).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText(/navigation handoff ready for open pickup navigation/i)).toBeTruthy();

    fireEvent.press(await screen.findByTestId('delivery-accept-assignment'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-pickup')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('confirm-pickup'));

    await waitFor(() => {
      expect(screen.getByTestId('complete-delivery')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId('delivery-recipient-name'), 'Sara Al-Qahtani');
    fireEvent.changeText(
      screen.getByTestId('delivery-proof-notes'),
      'Delivered to the lobby desk and confirmed with the customer.'
    );
    fireEvent.press(screen.getByTestId('complete-delivery'));

    await waitFor(() => {
      expect(screen.getByText(/delivery completed and proof captured/i)).toBeTruthy();
    });

    expect(screen.getByText(/delivered to sara al-qahtani/i)).toBeTruthy();
  });
});
