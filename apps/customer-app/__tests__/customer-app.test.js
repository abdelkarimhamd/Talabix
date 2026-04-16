import { afterEach, beforeEach, jest } from '@jest/globals';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AddressBookScreen } from '../src/screens/AddressBookScreen';
import { BranchCatalogScreen } from '../src/screens/BranchCatalogScreen';
import { CartScreen } from '../src/screens/CartScreen';
import { CustomerHomeScreen } from '../src/screens/CustomerHomeScreen';
import { CustomerNotificationsScreen } from '../src/screens/CustomerNotificationsScreen';
import { CustomerProfileScreen } from '../src/screens/CustomerProfileScreen';
import { CustomerRegistrationScreen } from '../src/screens/CustomerRegistrationScreen';
import { MerchantDetailScreen } from '../src/screens/MerchantDetailScreen';
import { OrderTrackingScreen } from '../src/screens/OrderTrackingScreen';
import { AppProviders } from '../src/providers/AppProviders';
import { resetCustomerApiState } from '../src/customer-api';

function renderWithProviders(ui) {
  return render(<AppProviders>{ui}</AppProviders>);
}

beforeEach(() => {
  resetCustomerApiState();
});

afterEach(() => {
  cleanup();
});

describe('customer identity and discovery slice', () => {
  it('validates and submits the registration form', async () => {
    renderWithProviders(<CustomerRegistrationScreen />);

    fireEvent.press(screen.getByTestId('submit-register'));
    expect(await screen.findByText(/please review the registration details/i)).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('register-name'), 'Layal Customer');
    fireEvent.changeText(screen.getByTestId('register-email'), 'layal@talabix.test');
    fireEvent.changeText(screen.getByTestId('register-phone'), '+966500000077');
    fireEvent.changeText(screen.getByTestId('register-password'), 'password123');
    fireEvent.changeText(screen.getByTestId('register-password-confirmation'), 'password123');
    fireEvent.press(screen.getByTestId('submit-register'));

    expect(await screen.findByText(/registered layal@talabix\.test/i)).toBeTruthy();
  });

  it('updates the customer profile form', async () => {
    renderWithProviders(<CustomerProfileScreen />);

    expect(await screen.findByText(/sahar@talabix\.test/i)).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('profile-name'), 'Layal Updated');
    fireEvent.changeText(screen.getByTestId('profile-phone'), '+966500000099');
    fireEvent.press(screen.getByTestId('submit-profile'));

    expect(await screen.findByText(/saved profile for layal updated/i)).toBeTruthy();
  });

  it('creates a richer address and keeps one default selection', async () => {
    renderWithProviders(<AddressBookScreen />);

    fireEvent.changeText(screen.getByTestId('place-search-query'), 'King Fahd');
    fireEvent.press(await screen.findByTestId('use-place-place-home-olaya'));
    fireEvent.changeText(screen.getByTestId('address-label'), 'Parents');
    fireEvent.changeText(screen.getByTestId('address-city'), 'Riyadh');
    fireEvent.changeText(screen.getByTestId('address-delivery-notes'), 'Use side entrance');
    fireEvent.press(screen.getByTestId('toggle-default-address'));
    fireEvent.press(screen.getByText(/create saved address/i));

    expect(await screen.findByText(/address created/i)).toBeTruthy();
    expect(await screen.findByText(/parents/i)).toBeTruthy();
    expect((await screen.findAllByText(/tower a/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/notes: use side entrance/i)).toBeTruthy();
  });

  it('updates merchant discovery when search and open now filters change', async () => {
    renderWithProviders(<CustomerHomeScreen />);

    expect(await screen.findByText(/talabix demo kitchen/i)).toBeTruthy();
    expect((await screen.findAllByText(/\d+ min eta/i)).length).toBeGreaterThan(0);

    fireEvent.changeText(screen.getByTestId('merchant-search'), 'Breakfast');

    await waitFor(() => {
      expect(screen.queryByText(/talabix demo kitchen/i)).toBeNull();
    });

    expect(await screen.findByText(/breakfast bazaar/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('toggle-open-now'));

    expect(await screen.findByText(/no merchants match the current address and filters/i)).toBeTruthy();
  });

  it('renders customer notifications and marks unread items as read', async () => {
    renderWithProviders(<CustomerNotificationsScreen />);

    expect(await screen.findByText(/rider assigned/i)).toBeTruthy();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(screen.getByTestId('mark-customer-notification-602'));
    });

    expect(await screen.findByText(/marked support updated your order as read/i)).toBeTruthy();

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(screen.getByTestId('toggle-customer-unread-only'));
    });

    await waitFor(() => {
      expect(screen.queryByText(/support added a handoff note/i)).toBeNull();
    });
  });

  it('renders merchant detail with serviceability aware branch summaries', async () => {
    renderWithProviders(
      <MerchantDetailScreen merchantId="0dbcc17d-16c1-4df5-89ec-c32007ebd38c" />
    );

    expect(await screen.findByText(/talabix demo kitchen/i)).toBeTruthy();
    expect(await screen.findByText(/olaya branch/i)).toBeTruthy();
    expect(await screen.findByText(/north branch/i)).toBeTruthy();
    expect((await screen.findAllByText(/serviceable branch/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/\d+ min eta/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/out of range/i)).toBeTruthy();
  });

  it('adds branch catalog items to cart and checks out into live tracking', async () => {
    const onCheckoutComplete = jest.fn();
    const view = renderWithProviders(
      <BranchCatalogScreen branchId="2ea03ee8-f346-42c2-968d-ab4aeae7040d" />
    );

    fireEvent.press(await screen.findByTestId('add-to-cart-shawarma'));
    await waitFor(() => {
      expect(screen.getByText(/3 cart items/i)).toBeTruthy();
    });

    await act(async () => {
      view.unmount();
    });
    const utils = renderWithProviders(<CartScreen onCheckoutComplete={onCheckoutComplete} />);

    fireEvent.changeText(screen.getByTestId('cart-notes'), 'Leave with security');
    expect(await screen.findByText(/checkout notes updated\./i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('checkout-now'));

    await waitFor(() => {
      expect(onCheckoutComplete).toHaveBeenCalledTimes(1);
    });

    const order = onCheckoutComplete.mock.calls[0][0];

    expect(await screen.findByText(/order .* created\./i)).toBeTruthy();

    await act(async () => {
      utils.unmount();
    });
    renderWithProviders(<OrderTrackingScreen orderId={order.uuid} />);

    expect(await screen.findByText(/talabix order tracking/i)).toBeTruthy();
    expect(await screen.findByText(/^placed$/i)).toBeTruthy();
  });
});
