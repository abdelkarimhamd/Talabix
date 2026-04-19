import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { afterEach, jest } from '@jest/globals';
import { RiderHomeScreen } from '../src/screens/RiderHomeScreen';
import { AssignmentsScreen } from '../src/screens/AssignmentsScreen';
import { DeliveryScreen } from '../src/screens/DeliveryScreen';
import { RiderEarningsScreen } from '../src/screens/RiderEarningsScreen';
import { RiderNotificationsScreen } from '../src/screens/RiderNotificationsScreen';
import { AppProviders } from '../src/providers/AppProviders';
import * as riderApi from '../src/rider-api';
import { labelForEnum } from '@talabix/shared/i18n';

function renderWithProviders(ui, options = {}) {
  return render(
    <AppProviders initialLocale={options.locale}>{ui}</AppProviders>
  );
}

afterEach(() => {
  cleanup();
  riderApi.resetRiderApiState();
  jest.restoreAllMocks();
});

describe('rider app shell', () => {
  it('renders the rider home screen in Arabic with RTL layout metadata', async () => {
    renderWithProviders(<RiderHomeScreen />, { locale: 'ar' });

    expect(await screen.findByText(/تطبيق المندوب/i)).toBeTruthy();
    expect(await screen.findByText(/مسار تسليم مبسط/i)).toBeTruthy();
    expect(await screen.findByText('متاح')).toBeTruthy();
    expect(screen.queryByText(/^available$/i)).toBeNull();
    expect(
      await screen.findByTestId('rider-locale-direction')
    ).toHaveTextContent('rtl');
  });

  it('renders the rider delivery overview', async () => {
    renderWithProviders(<RiderHomeScreen />);

    expect(
      await screen.findByText(
        /delivery flow optimized for one active order at a time/i
      )
    ).toBeTruthy();
    expect(await screen.findByText(/sara al-qahtani/i)).toBeTruthy();
  });

  it('prevents duplicate rider availability updates while pending', async () => {
    let releaseAvailability;
    const pendingAvailability = new Promise((resolve) => {
      releaseAvailability = resolve;
    });
    const originalUpdateAvailability = riderApi.updateRiderAvailability;
    const availabilitySpy = jest
      .spyOn(riderApi, 'updateRiderAvailability')
      .mockImplementation(async (availability) => {
        await pendingAvailability;
        return originalUpdateAvailability(availability);
      });

    renderWithProviders(<RiderHomeScreen />);

    const offlineButton = await screen.findByTestId('set-rider-offline');

    fireEvent.press(offlineButton);

    await waitFor(() => {
      expect(availabilitySpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/updating availability/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('set-rider-offline'));

    expect(availabilitySpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseAvailability();
      await pendingAvailability;
    });

    expect(
      await screen.findByText(/availability updated to offline/i)
    ).toBeTruthy();
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

  it('prevents duplicate rider assignment acceptance while pending', async () => {
    let releaseAccept;
    const pendingAccept = new Promise((resolve) => {
      releaseAccept = resolve;
    });
    const originalAccept = riderApi.acceptRiderAssignment;
    const acceptSpy = jest
      .spyOn(riderApi, 'acceptRiderAssignment')
      .mockImplementation(async (orderUuid) => {
        await pendingAccept;
        return originalAccept(orderUuid);
      });

    renderWithProviders(<AssignmentsScreen />);

    const acceptButton = await screen.findByTestId('accept-assignment');

    fireEvent.press(acceptButton);

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/accepting/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('accept-assignment'));

    expect(acceptSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseAccept();
      await pendingAccept;
    });

    expect(
      await screen.findByText(/head to the merchant and confirm pickup next/i)
    ).toBeTruthy();
  });

  it('renders rider notifications and marks unread items as read', async () => {
    renderWithProviders(<RiderNotificationsScreen />, { locale: 'ar' });

    expect(await screen.findByText(/new assignment ready/i)).toBeTruthy();
    expect(
      (
        await screen.findAllByText(
          labelForEnum('notificationType', 'order_status_updated', 'ar')
        )
      ).length
    ).toBeGreaterThan(0);
    expect(
      (
        await screen.findAllByText(
          labelForEnum('notificationType', 'support_note_added', 'ar')
        )
      ).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/^order status updated$/i)).toBeNull();
    expect(screen.queryByText(/^support note added$/i)).toBeNull();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(screen.getByTestId('mark-rider-notification-802'));
    });

    await waitFor(() => {
      expect(
        screen.getByText(/marked support updated the drop-off as read/i)
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('toggle-rider-unread-only'));

    await waitFor(() => {
      expect(
        screen.queryByText(
          /support added a note asking for a lobby desk handoff/i
        )
      ).toBeNull();
    });
  });

  it('removes a rider notification from unread-only results after marking it read', async () => {
    renderWithProviders(<RiderNotificationsScreen />);

    expect(await screen.findByText(/2 unread of 3/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('toggle-rider-unread-only'));

    expect(await screen.findByText(/2 unread of 2/i)).toBeTruthy();

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(screen.getByTestId('mark-rider-notification-802'));
    });

    await waitFor(() => {
      expect(
        screen.queryByText(
          /support added a note asking for a lobby desk handoff/i
        )
      ).toBeNull();
      expect(screen.getByText(/1 unread of 1/i)).toBeTruthy();
    });
  });

  it('prevents duplicate rider notification mark-read submissions while pending', async () => {
    let releaseMarkRead;
    const pendingMarkRead = new Promise((resolve) => {
      releaseMarkRead = resolve;
    });
    const originalMarkRead = riderApi.markRiderNotificationRead;
    const markReadSpy = jest
      .spyOn(riderApi, 'markRiderNotificationRead')
      .mockImplementation(async (notificationId) => {
        await pendingMarkRead;
        return originalMarkRead(notificationId);
      });

    renderWithProviders(<RiderNotificationsScreen />);

    const markButton = await screen.findByTestId('mark-rider-notification-802');

    fireEvent.press(markButton);

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/marking/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('mark-rider-notification-802'));

    expect(markReadSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseMarkRead();
      await pendingMarkRead;
    });

    expect(
      await screen.findByText(/marked support updated the drop-off as read/i)
    ).toBeTruthy();
  });

  it('renders rider earnings summary and recent delivered orders', async () => {
    renderWithProviders(<RiderEarningsScreen />);

    expect(await screen.findByText(/earnings this period/i)).toBeTruthy();
    expect(await screen.findByText(/SAR 47.00/i)).toBeTruthy();
    expect(await screen.findByText(/3 delivered orders/i)).toBeTruthy();
    expect(await screen.findByText(/mama noura/i)).toBeTruthy();
  });

  it('renders rider delivery enum labels in Arabic without raw wire keys', async () => {
    renderWithProviders(<DeliveryScreen />, { locale: 'ar' });

    expect(
      await screen.findByText(
        labelForEnum('orderTimelineEventType', 'order_placed', 'ar')
      )
    ).toBeTruthy();
    expect(
      await screen.findByText(
        labelForEnum('proofType', 'recipient_confirmation', 'ar')
      )
    ).toBeTruthy();
    expect(screen.queryByText(/^order placed$/i)).toBeNull();
    expect(screen.queryByText(/recipient_confirmation/i)).toBeNull();
  });

  it('completes the rider proof capture flow', async () => {
    const openExternalUrl = jest.fn(() => Promise.resolve());
    renderWithProviders(<DeliveryScreen openExternalUrl={openExternalUrl} />);

    fireEvent.press(await screen.findByTestId('open-pickup-navigation'));

    await waitFor(() => {
      expect(openExternalUrl).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.getByText(/navigation handoff ready for open pickup navigation/i)
    ).toBeTruthy();

    fireEvent.press(await screen.findByTestId('delivery-accept-assignment'));

    await waitFor(() => {
      expect(screen.getByTestId('confirm-pickup')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('confirm-pickup'));

    await waitFor(() => {
      expect(screen.getByTestId('complete-delivery')).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByTestId('delivery-recipient-name'),
      'Sara Al-Qahtani'
    );
    fireEvent.changeText(
      screen.getByTestId('delivery-proof-notes'),
      'Delivered to the lobby desk and confirmed with the customer.'
    );
    fireEvent.press(screen.getByTestId('complete-delivery'));

    await waitFor(() => {
      expect(
        screen.getByText(/delivery completed and proof captured/i)
      ).toBeTruthy();
    });

    expect(screen.getByText(/delivered to sara al-qahtani/i)).toBeTruthy();
  });

  it('prevents duplicate navigation handoffs while pending', async () => {
    let releaseNavigation;
    const pendingNavigation = new Promise((resolve) => {
      releaseNavigation = resolve;
    });
    const openExternalUrl = jest.fn(async () => {
      await pendingNavigation;
    });

    renderWithProviders(<DeliveryScreen openExternalUrl={openExternalUrl} />);

    const pickupNavigation = await screen.findByTestId(
      'open-pickup-navigation'
    );

    fireEvent.press(pickupNavigation);

    await waitFor(() => {
      expect(openExternalUrl).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/opening navigation/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('open-pickup-navigation'));

    expect(openExternalUrl).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseNavigation();
      await pendingNavigation;
    });

    expect(
      await screen.findByText(
        /navigation handoff ready for open pickup navigation/i
      )
    ).toBeTruthy();
  });

  it('prevents duplicate delivery-screen assignment acceptance while pending', async () => {
    let releaseAccept;
    const pendingAccept = new Promise((resolve) => {
      releaseAccept = resolve;
    });
    const originalAccept = riderApi.acceptRiderAssignment;
    const acceptSpy = jest
      .spyOn(riderApi, 'acceptRiderAssignment')
      .mockImplementation(async (orderUuid) => {
        await pendingAccept;
        return originalAccept(orderUuid);
      });

    renderWithProviders(<DeliveryScreen />);

    const acceptButton = await screen.findByTestId(
      'delivery-accept-assignment'
    );

    fireEvent.press(acceptButton);

    await waitFor(() => {
      expect(acceptSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/accepting/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('delivery-accept-assignment'));

    expect(acceptSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseAccept();
      await pendingAccept;
    });

    expect(await screen.findByText(/assignment accepted/i)).toBeTruthy();
  });

  it('prevents duplicate pickup confirmations while pending', async () => {
    await riderApi.acceptRiderAssignment(
      '4aa0f507-77b6-459c-adbe-ef8658cbdc51'
    );
    let releasePickup;
    const pendingPickup = new Promise((resolve) => {
      releasePickup = resolve;
    });
    const originalPickup = riderApi.confirmRiderPickup;
    const pickupSpy = jest
      .spyOn(riderApi, 'confirmRiderPickup')
      .mockImplementation(async (orderUuid) => {
        await pendingPickup;
        return originalPickup(orderUuid);
      });

    renderWithProviders(<DeliveryScreen />);

    const pickupButton = await screen.findByTestId('confirm-pickup');

    fireEvent.press(pickupButton);

    await waitFor(() => {
      expect(pickupSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/confirming pickup/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('confirm-pickup'));

    expect(pickupSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releasePickup();
      await pendingPickup;
    });

    expect(await screen.findByText(/pickup confirmed/i)).toBeTruthy();
  });

  it('prevents duplicate delivery completions while pending', async () => {
    await riderApi.acceptRiderAssignment(
      '4aa0f507-77b6-459c-adbe-ef8658cbdc51'
    );
    await riderApi.confirmRiderPickup('4aa0f507-77b6-459c-adbe-ef8658cbdc51');
    let releaseDelivery;
    const pendingDelivery = new Promise((resolve) => {
      releaseDelivery = resolve;
    });
    const originalDelivery = riderApi.completeRiderDelivery;
    const deliverySpy = jest
      .spyOn(riderApi, 'completeRiderDelivery')
      .mockImplementation(async (orderUuid, payload) => {
        await pendingDelivery;
        return originalDelivery(orderUuid, payload);
      });

    renderWithProviders(<DeliveryScreen />);

    const completeButton = await screen.findByTestId('complete-delivery');

    fireEvent.changeText(
      screen.getByTestId('delivery-recipient-name'),
      'Sara Al-Qahtani'
    );
    fireEvent.press(completeButton);

    await waitFor(() => {
      expect(deliverySpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/completing delivery/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('complete-delivery'));

    expect(deliverySpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseDelivery();
      await pendingDelivery;
    });

    expect(
      await screen.findByText(/delivery completed and proof captured/i)
    ).toBeTruthy();
  });
});
