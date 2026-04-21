import { afterEach, beforeEach, jest } from '@jest/globals';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { notifyManager } from '@tanstack/react-query';

const mockRouterPush = jest.fn();
const mockRequestCurrentLocation = jest.fn();

jest.setTimeout(15_000);

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('../src/location', () => ({
  requestCurrentLocation: (...args) => mockRequestCurrentLocation(...args),
}));

import { AddressBookScreen } from '../src/screens/AddressBookScreen';
import { BranchCatalogScreen } from '../src/screens/BranchCatalogScreen';
import { CartScreen } from '../src/screens/CartScreen';
import { CustomerHomeScreen } from '../src/screens/CustomerHomeScreen';
import { CustomerNotificationsScreen } from '../src/screens/CustomerNotificationsScreen';
import { CustomerOffersScreen } from '../src/screens/CustomerOffersScreen';
import { CustomerOrdersScreen } from '../src/screens/CustomerOrdersScreen';
import { CustomerPointsScreen } from '../src/screens/CustomerPointsScreen';
import { CustomerProfileScreen } from '../src/screens/CustomerProfileScreen';
import { CustomerRegistrationScreen } from '../src/screens/CustomerRegistrationScreen';
import { MerchantDetailScreen } from '../src/screens/MerchantDetailScreen';
import { OrderTrackingScreen } from '../src/screens/OrderTrackingScreen';
import { AppProviders } from '../src/providers/AppProviders';
import * as customerApi from '../src/customer-api';
import {
  AccentButton,
  FoodArtwork,
  colors,
  customerDockTabs,
  getArtworkAssetForLabel,
} from '../src/ui';
import { labelForEnum, t as translate } from '@talabix/shared/i18n';

function renderWithProviders(ui, options = {}) {
  return render(
    <AppProviders initialLocale={options.locale}>{ui}</AppProviders>
  );
}

function expectNoReactActWarnings(consoleErrorSpy) {
  const actWarnings = consoleErrorSpy.mock.calls.filter(([message]) =>
    String(message).includes('not wrapped in act')
  );

  expect(actWarnings).toHaveLength(0);
}

beforeEach(() => {
  customerApi.resetCustomerApiState();
  mockRequestCurrentLocation.mockReset();
  mockRequestCurrentLocation.mockResolvedValue({
    ok: true,
    latitude: 24.774265,
    longitude: 46.738586,
  });
  // Route TanStack Query's internal batch notifications through act() so
  // query-triggered state updates never fire outside an act boundary.
  notifyManager.setScheduler((cb) => {
    act(cb);
  });
});

afterEach(() => {
  notifyManager.setScheduler(setTimeout);
  cleanup();
  mockRouterPush.mockClear();
  jest.restoreAllMocks();
});

describe('customer identity and discovery slice', () => {
  it('renders the customer home screen in Arabic with RTL layout metadata', async () => {
    renderWithProviders(<CustomerHomeScreen />, { locale: 'ar' });

    expect(
      await screen.findByText(translate('customer.home.title', {}, 'ar'))
    ).toBeTruthy();
    expect(
      (
        await screen.findAllByText(
          translate('customer.home.categoryPickerTitle', {}, 'ar')
        )
      ).length
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText(labelForEnum('orderStatus', 'assigned', 'ar'))
    ).toBeTruthy();
    expect(
      (await screen.findAllByText(/talabix demo kitchen/i)).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText(/^assigned$/i)).toBeNull();
    expect(
      await screen.findByTestId('customer-locale-direction')
    ).toHaveTextContent('rtl');
  });

  it('validates and submits the registration form', async () => {
    renderWithProviders(<CustomerRegistrationScreen />);

    fireEvent.press(screen.getByTestId('submit-register'));
    expect(
      await screen.findByText(/please review the registration details/i)
    ).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('register-name'), 'Layal Customer');
    fireEvent.changeText(
      screen.getByTestId('register-email'),
      'layal@talabix.test'
    );
    fireEvent.changeText(screen.getByTestId('register-phone'), '+966500000077');
    fireEvent.changeText(
      screen.getByTestId('register-password'),
      'password123'
    );
    fireEvent.changeText(
      screen.getByTestId('register-password-confirmation'),
      'password123'
    );
    fireEvent.press(screen.getByTestId('submit-register'));

    expect(
      await screen.findByText(/registered layal@talabix\.test/i)
    ).toBeTruthy();
  });

  it('updates the customer profile form', async () => {
    renderWithProviders(<CustomerProfileScreen />);

    expect(
      (await screen.findAllByText(/sahar@talabix\.test/i)).length
    ).toBeGreaterThan(0);
    fireEvent.changeText(screen.getByTestId('profile-name'), 'Layal Updated');
    fireEvent.changeText(screen.getByTestId('profile-phone'), '+966500000099');
    fireEvent.press(screen.getByTestId('submit-profile'));

    expect(
      await screen.findByText(/saved profile for layal updated/i)
    ).toBeTruthy();
  });

  it('prevents duplicate profile saves while pending', async () => {
    let releaseProfile;
    const pendingProfile = new Promise((resolve) => {
      releaseProfile = resolve;
    });
    const originalUpdateProfile = customerApi.updateCustomerProfile;
    const updateProfileSpy = jest
      .spyOn(customerApi, 'updateCustomerProfile')
      .mockImplementation(async (payload) => {
        await pendingProfile;
        return originalUpdateProfile(payload);
      });

    renderWithProviders(<CustomerProfileScreen />);

    expect(
      (await screen.findAllByText(/sahar@talabix\.test/i)).length
    ).toBeGreaterThan(0);
    fireEvent.changeText(screen.getByTestId('profile-name'), 'Layal Updated');
    fireEvent.press(screen.getByTestId('submit-profile'));

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/saving profile/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('submit-profile'));

    expect(updateProfileSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseProfile();
      await pendingProfile;
    });

    expect(
      await screen.findByText(/saved profile for layal updated/i)
    ).toBeTruthy();
  });

  it('renders a customer points destination for the dock', async () => {
    renderWithProviders(<CustomerPointsScreen />);

    expect(
      (await screen.findAllByText(/hplus rewards/i)).length
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/9000 points/i)).length).toBeGreaterThan(
      0
    );
    expect(
      (await screen.findAllByText(/free delivery progress/i)).length
    ).toBeGreaterThan(0);
  });

  it('creates a richer address and keeps one default selection', async () => {
    renderWithProviders(<AddressBookScreen />);

    fireEvent.changeText(screen.getByTestId('place-search-query'), 'King Fahd');
    fireEvent.press(await screen.findByTestId('use-place-place-home-olaya'));
    fireEvent.changeText(screen.getByTestId('address-label'), 'Parents');
    fireEvent.changeText(screen.getByTestId('address-city'), 'Riyadh');
    fireEvent.changeText(
      screen.getByTestId('address-delivery-notes'),
      'Use side entrance'
    );
    fireEvent.press(screen.getByTestId('toggle-default-address'));
    fireEvent.press(screen.getByText(/create saved address/i));

    expect(await screen.findByText(/address created/i)).toBeTruthy();
    expect((await screen.findAllByText(/parents/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/tower a/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/notes: use side entrance/i)).toBeTruthy();
  });

  it('keeps manual address entry clear when map suggestions are unavailable', async () => {
    renderWithProviders(<AddressBookScreen />);

    fireEvent.changeText(
      screen.getByTestId('place-search-query'),
      'No Match Place'
    );

    expect(
      await screen.findByText(/enter the address and coordinates manually/i)
    ).toBeTruthy();
  });

  it('fills current GPS coordinates without replacing manual address fields', async () => {
    renderWithProviders(<AddressBookScreen />);

    fireEvent.changeText(
      screen.getByTestId('address-line-1'),
      'Manual Street 11'
    );
    fireEvent.changeText(screen.getByTestId('address-latitude'), '24.1000');
    fireEvent.changeText(screen.getByTestId('address-longitude'), '46.1000');
    fireEvent.press(screen.getByTestId('use-current-location'));

    await waitFor(() => {
      expect(screen.getByTestId('address-latitude').props.value).toBe(
        '24.774265'
      );
    });
    expect(screen.getByTestId('address-longitude').props.value).toBe(
      '46.738586'
    );
    expect(screen.getByTestId('address-line-1').props.value).toBe(
      'Manual Street 11'
    );
    expect(mockRequestCurrentLocation).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/current GPS coordinates added/i)
    ).toBeTruthy();
  });

  it('shows localized Arabic copy when current-location permission is denied', async () => {
    mockRequestCurrentLocation.mockResolvedValueOnce({
      ok: false,
      reason: 'permission-denied',
    });

    renderWithProviders(<AddressBookScreen />, { locale: 'ar' });

    fireEvent.press(screen.getByTestId('use-current-location'));

    expect(
      await screen.findByText(
        translate('customer.addressBook.locationPermissionDenied', {}, 'ar')
      )
    ).toBeTruthy();
    expect(screen.queryByText(/location permission is turned off/i)).toBeNull();
  });

  it('keeps manual coordinates available when current location is unavailable', async () => {
    mockRequestCurrentLocation.mockResolvedValueOnce({
      ok: false,
      reason: 'unavailable',
    });

    renderWithProviders(<AddressBookScreen />);

    fireEvent.changeText(screen.getByTestId('address-latitude'), '24.1000');
    fireEvent.changeText(screen.getByTestId('address-longitude'), '46.1000');
    fireEvent.press(screen.getByTestId('use-current-location'));

    expect(
      await screen.findByText(/current location is unavailable right now/i)
    ).toBeTruthy();
    expect(screen.getByTestId('address-latitude').props.value).toBe('24.1000');
    expect(screen.getByTestId('address-longitude').props.value).toBe('46.1000');
  });

  it('prevents duplicate address saves while pending', async () => {
    let releaseAddress;
    const pendingAddress = new Promise((resolve) => {
      releaseAddress = resolve;
    });
    const originalCreateAddress = customerApi.createCustomerAddress;
    const createAddressSpy = jest
      .spyOn(customerApi, 'createCustomerAddress')
      .mockImplementation(async (payload) => {
        await pendingAddress;
        return originalCreateAddress(payload);
      });

    renderWithProviders(<AddressBookScreen />);

    fireEvent.changeText(screen.getByTestId('place-search-query'), 'King Fahd');
    fireEvent.press(await screen.findByTestId('use-place-place-home-olaya'));
    fireEvent.changeText(screen.getByTestId('address-label'), 'Parents');
    fireEvent.press(screen.getByText(/create saved address/i));

    await waitFor(() => {
      expect(createAddressSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/saving address/i)).toBeTruthy();

    fireEvent.press(screen.getByText(/saving address/i));

    expect(createAddressSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseAddress();
      await pendingAddress;
    });

    expect(await screen.findByText(/address created/i)).toBeTruthy();
  });

  it('prevents duplicate default-address updates while pending', async () => {
    let releaseDefaultAddress;
    const pendingDefaultAddress = new Promise((resolve) => {
      releaseDefaultAddress = resolve;
    });
    const originalUpdateAddress = customerApi.updateCustomerAddress;
    const updateAddressSpy = jest
      .spyOn(customerApi, 'updateCustomerAddress')
      .mockImplementation(async (addressUuid, payload) => {
        await pendingDefaultAddress;
        return originalUpdateAddress(addressUuid, payload);
      });

    renderWithProviders(<AddressBookScreen />);

    const makeDefaultButton = await screen.findByTestId(
      'make-default-08956b0c-7676-46dd-bd4f-26791d365e44'
    );

    fireEvent.press(makeDefaultButton);

    await waitFor(() => {
      expect(updateAddressSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/making default/i)).toBeTruthy();

    fireEvent.press(
      screen.getByTestId('make-default-08956b0c-7676-46dd-bd4f-26791d365e44')
    );

    expect(updateAddressSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseDefaultAddress();
      await pendingDefaultAddress;
    });

    expect(await screen.findByText(/default address updated/i)).toBeTruthy();
  });

  it('updates merchant discovery when search and open now filters change', async () => {
    renderWithProviders(<CustomerHomeScreen />);

    expect(
      (await screen.findAllByText(/talabix demo kitchen/i)).length
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/\d+ min eta/i)).length).toBeGreaterThan(
      0
    );

    fireEvent.changeText(screen.getByTestId('merchant-search'), 'Breakfast');

    await waitFor(() => {
      expect(screen.queryAllByText(/talabix demo kitchen/i)).toHaveLength(0);
    });

    expect(
      (await screen.findAllByText(/breakfast bazaar/i)).length
    ).toBeGreaterThan(0);

    fireEvent.press(screen.getByTestId('toggle-open-now'));

    expect(
      await screen.findByText(
        /no merchants match the current address and filters/i
      )
    ).toBeTruthy();
  });

  it('navigates the floating dock through real customer routes', async () => {
    renderWithProviders(<CustomerPointsScreen />);

    expect(customerDockTabs.map((tab) => tab.href)).toEqual([
      '/',
      '/orders',
      '/offers',
      '/points',
      '/profile',
    ]);

    fireEvent.press(await screen.findByTestId('dock-tab-orders'));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/orders');

    fireEvent.press(screen.getByTestId('dock-tab-offers'));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/offers');

    fireEvent.press(screen.getByTestId('dock-tab-points'));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/points');

    fireEvent.press(screen.getByTestId('dock-tab-profile'));
    expect(mockRouterPush).toHaveBeenLastCalledWith('/profile');
  });

  it('applies the customer design-system dimensions for core mobile chrome', async () => {
    const view = renderWithProviders(<CustomerPointsScreen />);

    expect(
      StyleSheet.flatten(screen.getByTestId('dock-tab-points').props.style)
        .backgroundColor
    ).toBe(colors.primary);

    await act(async () => {
      view.unmount();
    });

    renderWithProviders(
      <>
        <AccentButton label="Primary action" testID="primary-design-button" />
        <FoodArtwork compact label="Coffee Corner" />
      </>
    );

    expect(
      StyleSheet.flatten(
        screen.getByTestId('primary-design-button').props.style
      )
    ).toEqual(expect.objectContaining({ borderRadius: 14, minHeight: 52 }));
    expect(
      StyleSheet.flatten(
        screen.getByTestId('packaged-artwork-coffee').props.style
      ).height
    ).toBe(100);
  });

  it('uses local product artwork assets instead of temporary remote URLs', () => {
    const asset = getArtworkAssetForLabel('Chicken Shawarma');

    expect(asset.kind).toBe('packaged-raster-artwork');
    expect(asset.fileName).toMatch(/\.(png|jpe?g)$/i);
    expect(JSON.stringify(asset)).not.toMatch(/https?:\/\//i);
    expect(asset.productLabel).toMatch(/shawarma|burger|market|coffee|gift/i);
  });

  it('renders customer order history from the orders API', async () => {
    renderWithProviders(<CustomerOrdersScreen />);

    expect(
      (await screen.findAllByText(/order history/i)).length
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText(/talabix demo kitchen/i)).length
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/4AA0F507/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/reorder/i)).length).toBeGreaterThan(0);

    const orders = await customerApi.getCustomerOrderHistory();

    expect(orders.length).toBeGreaterThanOrEqual(3);
    expect(orders[0]).toEqual(
      expect.objectContaining({
        merchantName: 'Talabix Demo Kitchen',
        orderCode: '4AA0F507',
      })
    );
  });

  it('reorders a past order into the cart and opens checkout', async () => {
    renderWithProviders(<CustomerOrdersScreen />);

    fireEvent.press(await screen.findByTestId('order-history-action-7F3EF1A5'));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenLastCalledWith('/cart');
    });

    const cart = await customerApi.getCartSummary();

    expect(cart.branchUuid).toBe('f3950349-28d9-48e7-89a4-a18c54c88211');
    expect(cart.itemCount).toBe(3);
    expect(cart.items.map((item) => item.name)).toEqual(
      expect.arrayContaining(['Fresh Market Basket', 'Cold Coffee Pack'])
    );
  });

  it('renders customer offers from the offers API', async () => {
    renderWithProviders(<CustomerOffersScreen />);

    expect(
      (await screen.findAllByText(/offers near you/i)).length
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText(/free delivery/i)).length
    ).toBeGreaterThan(0);
    expect(await screen.findByText(/chicken shawarma/i)).toBeTruthy();

    const offers = await customerApi.getCustomerOffers();

    expect(offers.length).toBeGreaterThanOrEqual(3);
    expect(offers[0]).toEqual(
      expect.objectContaining({
        discountLabel: expect.any(String),
        itemName: expect.any(String),
      })
    );
  });

  it('opens a catalog deep link when viewing an offer', async () => {
    renderWithProviders(<CustomerOffersScreen />);

    fireEvent.press(
      await screen.findByTestId('customer-offer-free-delivery-shawarma')
    );

    expect(mockRouterPush).toHaveBeenLastCalledWith(
      '/branches/2ea03ee8-f346-42c2-968d-ab4aeae7040d/catalog?offerId=free-delivery-shawarma&item=11111111-1111-4111-8111-111111111111'
    );
  });

  it('applies eligible offer discounts to cart totals and checkout pricing', async () => {
    const cart = await customerApi.getCartSummary();

    expect(cart.subtotalMinor).toBe(3500);
    expect(cart.deliveryFeeMinor).toBe(1200);
    expect(cart.itemDiscountMinor).toBe(0);
    expect(cart.deliveryDiscountMinor).toBe(1200);
    expect(cart.discountMinor).toBe(1200);
    expect(cart.totalMinor).toBe(3500);
    expect(cart.appliedOffers.map((offer) => offer.id)).toContain(
      'free-delivery-shawarma'
    );

    const order = await customerApi.checkoutCart();

    expect(order.total_minor).toBe(3500);
    expect(order.pricing_snapshot.discount_minor).toBe(1200);
    expect(order.applied_offer_ids).toEqual(['free-delivery-shawarma']);
    expect(order.pricing_snapshot.applied_offer_ids).toEqual([
      'free-delivery-shawarma',
    ]);
    expect(order.pricing_snapshot.applied_offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'free-delivery-shawarma' }),
      ])
    );
  });

  it('combines percent and fixed item offers on reordered market carts', async () => {
    const cart = await customerApi.reorderCustomerOrder(
      '7f3ef1a5-f69c-4f77-9b47-6f5abdbd6321'
    );

    expect(cart.subtotalMinor).toBe(12000);
    expect(cart.deliveryFeeMinor).toBe(700);
    expect(cart.itemDiscountMinor).toBe(1680);
    expect(cart.deliveryDiscountMinor).toBe(0);
    expect(cart.discountMinor).toBe(1680);
    expect(cart.totalMinor).toBe(11020);
    expect(cart.appliedOffers.map((offer) => offer.id)).toEqual([
      'market-basket-save',
    ]);

    const redeemedCart = await customerApi.redeemCartPromoCode('coffee8');

    expect(redeemedCart.itemDiscountMinor).toBe(2480);
    expect(redeemedCart.discountMinor).toBe(2480);
    expect(redeemedCart.totalMinor).toBe(10220);
    expect(redeemedCart.appliedOfferIds).toEqual(
      expect.arrayContaining(['market-basket-save', 'morning-coffee-pack'])
    );
    expect(redeemedCart.redeemedPromoCodes).toEqual(['COFFEE8']);
  });

  it('renders applied offer savings in the cart summary', async () => {
    await customerApi.reorderCustomerOrder(
      '7f3ef1a5-f69c-4f77-9b47-6f5abdbd6321'
    );

    renderWithProviders(<CartScreen />);

    fireEvent.changeText(
      await screen.findByTestId('cart-promo-code'),
      'coffee8'
    );
    fireEvent.press(screen.getByTestId('apply-promo-code'));

    expect(await screen.findByText(/offer savings/i)).toBeTruthy();
    expect(await screen.findByText(/promo code coffee8 applied/i)).toBeTruthy();
    expect(await screen.findByText(/save on market baskets/i)).toBeTruthy();
    expect(await screen.findByText(/coffee pack deal/i)).toBeTruthy();
    expect(await screen.findByText(/total discounts/i)).toBeTruthy();
  });

  it('renders customer notifications and marks unread items as read', async () => {
    renderWithProviders(<CustomerNotificationsScreen />, { locale: 'ar' });

    expect(await screen.findByText(/rider assigned/i)).toBeTruthy();
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
      fireEvent.press(screen.getByTestId('mark-customer-notification-602'));
    });

    expect(
      await screen.findByText(/marked support updated your order as read/i)
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId('toggle-customer-unread-only'));

    await waitFor(() => {
      expect(screen.queryByText(/support added a handoff note/i)).toBeNull();
    });
  });

  it('removes a customer notification from unread-only results after marking it read', async () => {
    renderWithProviders(<CustomerNotificationsScreen />);

    expect(await screen.findByText(/2 unread of 3/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('toggle-customer-unread-only'));

    expect(await screen.findByText(/2 unread of 2/i)).toBeTruthy();

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(screen.getByTestId('mark-customer-notification-602'));
    });

    await waitFor(() => {
      expect(screen.queryByText(/support added a handoff note/i)).toBeNull();
      expect(screen.getByText(/1 unread of 1/i)).toBeTruthy();
    });
  });

  it('updates customer notification feedback without React act warnings', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    renderWithProviders(<CustomerNotificationsScreen />);

    const markReadButton = await screen.findByTestId(
      'mark-customer-notification-602'
    );

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.press(markReadButton);
    });

    expect(
      await screen.findByText(/marked support updated your order as read/i)
    ).toBeTruthy();
    expectNoReactActWarnings(consoleErrorSpy);
  });

  it('prevents duplicate customer notification mark-read submissions while pending', async () => {
    let releaseMarkRead;
    const pendingMarkRead = new Promise((resolve) => {
      releaseMarkRead = resolve;
    });
    const originalMarkRead = customerApi.markCustomerNotificationRead;
    const markReadSpy = jest
      .spyOn(customerApi, 'markCustomerNotificationRead')
      .mockImplementation(async (notificationId) => {
        await pendingMarkRead;
        return originalMarkRead(notificationId);
      });

    renderWithProviders(<CustomerNotificationsScreen />);

    const markButton = await screen.findByTestId(
      'mark-customer-notification-602'
    );

    fireEvent.press(markButton);

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/marking/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('mark-customer-notification-602'));

    expect(markReadSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseMarkRead();
      await pendingMarkRead;
    });

    expect(
      await screen.findByText(/marked support updated your order as read/i)
    ).toBeTruthy();
  });

  it('renders merchant detail with serviceability aware branch summaries', async () => {
    renderWithProviders(
      <MerchantDetailScreen merchantId="0dbcc17d-16c1-4df5-89ec-c32007ebd38c" />
    );

    expect(await screen.findByText(/talabix demo kitchen/i)).toBeTruthy();
    expect(await screen.findByText(/olaya branch/i)).toBeTruthy();
    expect(await screen.findByText(/north branch/i)).toBeTruthy();
    expect(
      (await screen.findAllByText(/serviceable branch/i)).length
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/\d+ min eta/i)).length).toBeGreaterThan(
      0
    );
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
    const utils = renderWithProviders(
      <CartScreen onCheckoutComplete={onCheckoutComplete} />
    );

    fireEvent.changeText(
      screen.getByTestId('cart-notes'),
      'Leave with security'
    );
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
    renderWithProviders(<OrderTrackingScreen orderId={order.uuid} />, {
      locale: 'ar',
    });

    expect(await screen.findByText(/talabix order tracking/i)).toBeTruthy();
    expect(
      await screen.findByText(labelForEnum('orderStatus', 'placed', 'ar'))
    ).toBeTruthy();
    expect(
      await screen.findByText(
        labelForEnum('orderTimelineEventType', 'order_placed', 'ar')
      )
    ).toBeTruthy();
    expect(screen.queryByText(/^placed$/i)).toBeNull();
    expect(screen.queryByText(/^order placed$/i)).toBeNull();
  });

  it('surfaces rider delivery exceptions in order tracking', async () => {
    renderWithProviders(<OrderTrackingScreen />, { locale: 'ar' });

    expect(await screen.findByText(/delivery issue reported/i)).toBeTruthy();
    expect(
      await screen.findByText(
        labelForEnum('deliveryExceptionReason', 'address_issue', 'ar')
      )
    ).toBeTruthy();
    expect(screen.queryByText(/^Address issue$/i)).toBeNull();
    expect(await screen.findByText(/side entrance/i)).toBeTruthy();
  });

  it('prevents duplicate checkout submissions while pending', async () => {
    let releaseCheckout;
    const pendingCheckout = new Promise((resolve) => {
      releaseCheckout = resolve;
    });
    const originalCheckout = customerApi.checkoutCart;
    const checkoutSpy = jest
      .spyOn(customerApi, 'checkoutCart')
      .mockImplementation(async () => {
        await pendingCheckout;
        return originalCheckout();
      });
    const onCheckoutComplete = jest.fn();

    renderWithProviders(<CartScreen onCheckoutComplete={onCheckoutComplete} />);

    await screen.findByText(/chicken shawarma/i);
    const checkoutButton = await screen.findByTestId('checkout-now');

    fireEvent.press(checkoutButton);

    await waitFor(() => {
      expect(checkoutSpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/placing order/i)).toBeTruthy();

    fireEvent.press(screen.getByTestId('checkout-now'));

    expect(checkoutSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseCheckout();
      await pendingCheckout;
    });

    expect(onCheckoutComplete).toHaveBeenCalledTimes(1);
  });

  it('prevents duplicate cart quantity changes while pending', async () => {
    let releaseQuantity;
    const pendingQuantity = new Promise((resolve) => {
      releaseQuantity = resolve;
    });
    const originalUpdateQuantity = customerApi.updateCartItemQuantity;
    const updateQuantitySpy = jest
      .spyOn(customerApi, 'updateCartItemQuantity')
      .mockImplementation(async (lineId, quantity) => {
        await pendingQuantity;
        return originalUpdateQuantity(lineId, quantity);
      });

    renderWithProviders(<CartScreen />);

    await screen.findByText(/chicken shawarma/i);
    fireEvent.press(screen.getAllByText(/add one/i)[0]);

    await waitFor(() => {
      expect(updateQuantitySpy).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/adding/i)).toBeTruthy();

    fireEvent.press(screen.getAllByText(/add one/i)[0]);

    expect(updateQuantitySpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseQuantity();
      await pendingQuantity;
    });

    expect(await screen.findByText(/3 cart items/i)).toBeTruthy();
  });
});
