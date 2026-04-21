import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.jsx';
import { resetPortalApiState } from './portal-api.js';
import {
  defaultMerchantSession,
  defaultOpsSession,
  portalAuthStorageKey,
} from './session-defaults.js';

describe('portal routing', () => {
  beforeEach(() => {
    resetPortalApiState();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the admin login screen when no portal token is stored', () => {
    render(<App initialEntries={['/ops/dashboard']} />);

    expect(
      screen.getByRole('heading', { name: /sign in to talabix ops/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('stores the ops Sanctum token after admin login', async () => {
    const loginAdmin = vi.fn().mockResolvedValue({
      token: 'live-ops-token',
      user: {
        uuid: '4d491f47-d784-4fa0-bb3a-52b68c3ed9fc',
        name: 'Talabix Owner',
        email: 'owner@talabix.test',
        phone: null,
        account_status: 'active',
        roles: ['ops_admin'],
        abilities: [
          'ops:dashboard.read',
          'ops:merchants.manage',
          'ops:dispatch.manage',
          'ops:settlements.read',
          'ops:settlements.manage',
          'ops:support.manage',
          'ops:users.manage',
        ],
      },
    });

    render(<App initialEntries={['/ops/dashboard']} loginAdmin={loginAdmin} />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'owner@talabix.test' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/marketplace kpi view across orders/i)
    ).toBeInTheDocument();
    expect(loginAdmin).toHaveBeenCalledWith({
      email: 'owner@talabix.test',
      password: 'secret',
      device_name: 'portal-web',
    });
    expect(window.localStorage.getItem(portalAuthStorageKey)).toContain(
      'live-ops-token'
    );
  });

  it('blocks merchant sessions from ops routes', async () => {
    render(
      <App
        initialEntries={['/ops/dispatch']}
        initialSession={defaultMerchantSession}
      />
    );

    expect(
      await screen.findByText(/not authorized for this route/i)
    ).toBeInTheDocument();
  });

  it('renders the merchant order board for merchant users', async () => {
    render(
      <App
        initialEntries={['/merchant/orders']}
        initialSession={defaultMerchantSession}
      />
    );

    expect(
      await screen.findByText(/fulfillment from placed to pickup-ready/i)
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/sara al-qahtani/i)).length
    ).toBeGreaterThan(0);
    expect(
      await screen.findByRole('button', {
        name: /accept order sara al-qahtani/i,
      })
    ).toBeInTheDocument();
  });

  it('advances merchant fulfillment actions on the board', async () => {
    render(
      <App
        initialEntries={['/merchant/orders']}
        initialSession={defaultMerchantSession}
      />
    );

    const newOrderCard = await screen.findByTestId(
      'merchant-order-4aa0f507-77b6-459c-adbe-ef8658cbdc51'
    );

    fireEvent.click(
      within(newOrderCard).getByRole('button', {
        name: /accept order sara al-qahtani/i,
      })
    );

    await waitFor(() => {
      expect(
        within(
          screen.getByTestId(
            'merchant-order-4aa0f507-77b6-459c-adbe-ef8658cbdc51'
          )
        ).getByText(/^accepted$/i)
      ).toBeInTheDocument();
    });

    expect(
      await screen.findByText(/sara al-qahtani accepted\./i)
    ).toBeInTheDocument();

    const acceptedOrderCard = await screen.findByTestId(
      'merchant-order-3bdb4618-3d6c-4736-b94f-c7e17f0ff972'
    );

    fireEvent.click(
      within(acceptedOrderCard).getByRole('button', {
        name: /start preparing noura al-harbi/i,
      })
    );

    await waitFor(() => {
      expect(
        within(
          screen.getByTestId(
            'merchant-order-3bdb4618-3d6c-4736-b94f-c7e17f0ff972'
          )
        ).getByText(/^preparing$/i)
      ).toBeInTheDocument();
    });

    const preparingOrderCard = screen.getByTestId(
      'merchant-order-3bdb4618-3d6c-4736-b94f-c7e17f0ff972'
    );

    fireEvent.click(
      within(preparingOrderCard).getByRole('button', {
        name: /mark ready noura al-harbi/i,
      })
    );

    await waitFor(() => {
      expect(
        within(
          screen.getByTestId(
            'merchant-order-3bdb4618-3d6c-4736-b94f-c7e17f0ff972'
          )
        ).getByText(/^ready for pickup$/i)
      ).toBeInTheDocument();
    });

    const readyOrderCard = screen.getByTestId(
      'merchant-order-3bdb4618-3d6c-4736-b94f-c7e17f0ff972'
    );

    fireEvent.click(
      within(readyOrderCard).getByRole('button', { name: /view timeline/i })
    );

    expect(
      await screen.findByText(/merchant fulfillment: ready for pickup/i)
    ).toBeInTheDocument();
  });

  it('lets merchant users manage catalog items and branch overrides', async () => {
    render(
      <App
        initialEntries={['/merchant/catalog']}
        initialSession={defaultMerchantSession}
      />
    );

    expect(
      await screen.findByText(/merchant-owned menu with branch overrides/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/double burger/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/new catalog item name/i), {
      target: { value: 'Halloumi Fries' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog category/i), {
      target: { value: 'Sides' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog item sku/i), {
      target: { value: 'halloumi-fries' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog base price/i), {
      target: { value: '2100' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog base stock/i), {
      target: { value: '16' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog item description/i), {
      target: { value: 'Crisp halloumi sticks with house chili honey.' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog image url/i), {
      target: {
        value: 'https://images.talabix.test/catalog/halloumi-fries.jpg',
      },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /create catalog item/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /halloumi fries created in the shared merchant catalog/i
        )
      ).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue(/halloumi fries/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^catalog item name$/i), {
      target: { value: 'Halloumi Fries Box' },
    });
    fireEvent.change(screen.getByLabelText(/^catalog category$/i), {
      target: { value: 'Loaded sides' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save base item/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/halloumi fries box base item updated/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/new modifier group name/i), {
      target: { value: 'Sauce' },
    });
    fireEvent.change(screen.getByLabelText(/option name/i), {
      target: { value: 'Garlic mayo' },
    });
    fireEvent.change(screen.getByLabelText(/price delta/i), {
      target: { value: '150' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /create modifier group/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/sauce modifier group added/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/olaya branch override price/i), {
      target: { value: '2300' },
    });
    fireEvent.change(screen.getByLabelText(/olaya branch override stock/i), {
      target: { value: '11' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /save olaya branch override/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/olaya branch override saved/i)
      ).toBeInTheDocument();
    });
  });

  it('renders merchant catalog in read-only mode without write scope', async () => {
    render(
      <App
        initialEntries={['/merchant/catalog']}
        initialSession={{
          ...defaultMerchantSession,
          permissions: defaultMerchantSession.permissions.filter(
            (permission) => permission !== 'merchant:catalog.write'
          ),
        }}
      />
    );

    expect(
      await screen.findByText(/merchant-owned menu with branch overrides/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /create catalog item/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /save base item/i })
    ).not.toBeInTheDocument();
  });

  it('lets ops users manage catalog items from the ops catalog route', async () => {
    render(
      <App
        initialEntries={['/ops/catalog']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(/merchant-owned menu with branch overrides/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/new catalog item name/i), {
      target: { value: 'Arabic Coffee' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog category/i), {
      target: { value: 'Drinks' },
    });
    fireEvent.change(screen.getByLabelText(/new catalog base price/i), {
      target: { value: '1200' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /create catalog item/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /arabic coffee created in the shared merchant catalog/i
        )
      ).toBeInTheDocument();
    });
  });

  it('renders merchant promotion management for merchant users', async () => {
    render(
      <App
        initialEntries={['/merchant/promotions']}
        initialSession={defaultMerchantSession}
      />
    );

    expect(
      await screen.findByText(/manage promo-code and auto-apply offers/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create promotion/i })
    ).toBeInTheDocument();
  });

  it('shows merchant inbox notifications and lets the merchant mark one as read', async () => {
    render(
      <App
        initialEntries={['/merchant/notifications']}
        initialSession={defaultMerchantSession}
      />
    );

    expect(
      await screen.findByText(
        /in-app merchant notifications stay scoped to the store team/i
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/order ready for pickup/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Order status updated$/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/^order_status_updated$/)
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mark read/i }));

    await waitFor(() => {
      expect(screen.getByText(/marked as read\./i)).toBeInTheDocument();
    });
  });

  it('removes merchant notifications from unread-only results after marking them read', async () => {
    render(
      <App
        initialEntries={['/merchant/notifications']}
        initialSession={defaultMerchantSession}
      />
    );

    expect(await screen.findByText(/^1 unread$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show unread only/i }));

    expect(
      await screen.findByRole('heading', { name: /order ready for pickup/i })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /mark read: order ready for pickup/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/^0 unread$/i)).toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: /order ready for pickup/i })
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/no notifications match the current filter/i)
      ).toBeInTheDocument();
    });
  });

  it('renders merchant sales reporting with branch and item breakdowns', async () => {
    render(
      <App
        initialEntries={['/merchant/reports']}
        initialSession={defaultMerchantSession}
      />
    );

    expect(
      await screen.findByText(
        /sales, branch performance, and top-selling items/i
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/diplomatic quarter branch/i)
    ).toBeInTheDocument();
    expect(await screen.findAllByText(/loaded fries/i)).not.toHaveLength(0);
  });

  it('renders the ops dashboard with order, finance, and rider metrics', async () => {
    render(
      <App
        initialEntries={['/ops/dashboard']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(
        /marketplace KPI view across orders, finance, and rider earnings/i
      )
    ).toBeInTheDocument();
    expect(await screen.findByText(/payout exposure/i)).toBeInTheDocument();
    expect(await screen.findByText(/available riders/i)).toBeInTheDocument();
  });

  it('lets ops users change their portal password', async () => {
    render(
      <App
        initialEntries={['/ops/account']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByRole('heading', { name: /change your ops password/i })
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'old-password' },
    });
    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'new-password-123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'new-password-123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/password updated successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('lets super admins invite and disable ops users', async () => {
    render(
      <App initialEntries={['/ops/users']} initialSession={defaultOpsSession} />
    );

    expect(
      await screen.findByRole('heading', {
        name: /invite and disable ops users/i,
      })
    ).toBeInTheDocument();

    const inviteForm = screen.getByTestId('ops-user-invite-form');

    fireEvent.change(within(inviteForm).getByLabelText(/^name$/i), {
      target: { value: 'Codex Support' },
    });
    fireEvent.change(within(inviteForm).getByLabelText(/email address/i), {
      target: { value: 'codex-support@talabix.test' },
    });
    fireEvent.change(within(inviteForm).getByLabelText(/phone number/i), {
      target: { value: '+966500000099' },
    });
    fireEvent.change(within(inviteForm).getByLabelText(/^role$/i), {
      target: { value: 'ops_support' },
    });
    fireEvent.change(
      within(inviteForm).getByLabelText(/^temporary password$/i),
      {
        target: { value: 'temporary-123' },
      }
    );
    fireEvent.change(
      within(inviteForm).getByLabelText(/confirm temporary password/i),
      {
        target: { value: 'temporary-123' },
      }
    );
    fireEvent.click(
      within(inviteForm).getByRole('button', { name: /invite ops user/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/codex support was invited/i)
      ).toBeInTheDocument();
    });

    const createdCard = screen.getByTestId(
      'ops-user-codex-support@talabix.test'
    );
    fireEvent.click(
      within(createdCard).getByRole('button', { name: /disable user/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/codex support was updated/i)
      ).toBeInTheDocument();
    });
    expect(
      within(
        screen.getByTestId('ops-user-codex-support@talabix.test')
      ).getByLabelText(/^status$/i)
    ).toHaveValue('suspended');
  });

  it('exposes keyboard-friendly portal chrome controls', async () => {
    render(
      <App
        initialEntries={['/ops/dashboard']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      screen.getByRole('link', { name: /skip to main content/i })
    ).toHaveAttribute('href', '#portal-main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'portal-main');
    expect(screen.getByRole('button', { name: /english/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /arabic/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    expect(
      await screen.findByText(
        /marketplace KPI view across orders, finance, and rider earnings/i
      )
    ).toBeInTheDocument();
  });

  it('switches portal actor sessions from the sidebar controls', async () => {
    render(
      <App
        initialEntries={['/ops/dashboard']}
        initialSession={defaultOpsSession}
      />
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /switch to merchant session/i })
    );

    expect(
      await screen.findByRole('link', { name: /merchant orders/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/fulfillment from placed to pickup-ready/i)
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('talabix.portal.actor')).toBe(
      'merchant'
    );
  });

  it('renders Arabic RTL portal chrome and can switch back to English', async () => {
    render(
      <App
        initialEntries={['/ops/dashboard']}
        initialLocale="ar"
        initialSession={defaultOpsSession}
      />
    );

    expect(document.documentElement).toHaveAttribute('lang', 'ar');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(
      await screen.findByRole('link', { name: /لوحة العمليات/i })
    ).toBeInTheDocument();
    expect(await screen.findByText(/مؤشرات السوق/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /English/i }));

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('lang', 'en');
    });
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
    expect(
      await screen.findByRole('link', { name: /Ops Dashboard/i })
    ).toBeInTheDocument();
  });

  it('renders dispatch actions for ops users', async () => {
    render(
      <App
        initialEntries={['/ops/dispatch']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(/auto-assignment with manual override/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/live coverage map/i)).toBeInTheDocument();
    expect(await screen.findByText(/ops\.dispatch/i)).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/sla breached/i)).length
    ).toBeGreaterThan(0);
    expect((await screen.findAllByText(/order state/i)).length).toBeGreaterThan(
      0
    );
    expect(
      (await screen.findAllByText(/last rider ping/i)).length
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText(/reassign to reem al-shehri/i)
    ).toBeInTheDocument();
    expect((await screen.findAllByText(/pickup eta/i)).length).toBeGreaterThan(
      0
    );
    expect(
      (await screen.findAllByRole('button', { name: /manual reassign/i }))
        .length
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText(/delivery issue/i)).length
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText(/address issue/i)).length
    ).toBeGreaterThan(0);
    expect(
      (await screen.findAllByText(/exception response breached/i)).length
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText(/response window 15\/10 min/i)
    ).toBeInTheDocument();
  });

  it('lets ops users reassign a dispatch order with an SLA reason', async () => {
    render(
      <App
        initialEntries={['/ops/dispatch']}
        initialSession={defaultOpsSession}
      />
    );

    const assignmentCard = await screen.findByTestId(
      'dispatch-assignment-3bdb4618-3d6c-4736-b94f-c7e17f0ff972'
    );

    fireEvent.click(
      within(assignmentCard).getByRole('button', { name: /manual reassign/i })
    );
    fireEvent.change(within(assignmentCard).getByLabelText(/new rider/i), {
      target: { value: 'ff10916f-9ec0-412f-b6c6-bd8f436f4002' },
    });
    fireEvent.change(
      within(assignmentCard).getByLabelText(/reassignment reason/i),
      {
        target: { value: 'sla_risk' },
      }
    );
    fireEvent.change(
      within(assignmentCard).getByLabelText(/reassignment note/i),
      {
        target: { value: 'Move to the closer rider before SLA breach.' },
      }
    );
    fireEvent.click(
      within(assignmentCard).getByRole('button', {
        name: /confirm reassignment/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/reassigned 3BDB4618 to Reem Al-Shehri for SLA risk/i)
      ).toBeInTheDocument();
    });
  });

  it('lets ops users manage commissions, branch flags, zones, and fee bands', async () => {
    render(
      <App
        initialEntries={['/ops/configuration']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(
        /control commissions, branch order-taking, service zones, and fees/i
      )
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(/merchant platform commission bps/i),
      {
        target: { value: '1450' },
      }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /save merchant configuration/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/demo merchant commission saved at 14\.50%/i)
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText(/branch accepts orders/i));
    fireEvent.click(
      screen.getByRole('button', { name: /save branch configuration/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/olaya branch branch settings saved/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/service zone name/i), {
      target: { value: 'North Ring' },
    });
    fireEvent.change(screen.getByLabelText(/service zone postal code/i), {
      target: { value: '11564' },
    });
    fireEvent.change(screen.getByLabelText(/service zone radius meters/i), {
      target: { value: '9000' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /create service zone/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/north ring service zone saved/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByLabelText(/fee band maximum distance meters/i),
      {
        target: { value: '18000' },
      }
    );
    fireEvent.change(screen.getByLabelText(/fee band fee minor/i), {
      target: { value: '2100' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create fee band/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/fee band 0-18000 meters saved/i)
      ).toBeInTheDocument();
    });
  });

  it('lets ops users prepare Google Maps credentials without exposing the key', async () => {
    render(
      <App
        initialEntries={['/ops/configuration']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(/google maps provider/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/api key not configured/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/google maps api key/i), {
      target: { value: 'AIzaSyPortalOnly1234' },
    });
    fireEvent.change(screen.getByLabelText(/google maps region/i), {
      target: { value: 'sa' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /save maps provider configuration/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/google maps configuration saved/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/configured via admin/i)).toBeInTheDocument();
    expect(screen.getByText(/••••••••1234/)).toBeInTheDocument();
    expect(screen.queryByText(/AIzaSyPortalOnly1234/)).not.toBeInTheDocument();
  });

  it('lets ops users manage promo-code and auto-apply promotion offers', async () => {
    render(
      <App
        initialEntries={['/ops/promotions']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(/manage promo-code and auto-apply offers/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/promotion title/i), {
      target: { value: 'Burger promo' },
    });
    fireEvent.change(screen.getByLabelText(/promotion discount label/i), {
      target: { value: 'SAR 10 off' },
    });
    fireEvent.change(screen.getByLabelText(/promotion discount type/i), {
      target: { value: 'item_fixed' },
    });
    fireEvent.change(screen.getByLabelText(/promotion amount minor/i), {
      target: { value: '1000' },
    });
    fireEvent.change(screen.getByLabelText(/promotion minimum spend minor/i), {
      target: { value: '2500' },
    });
    fireEvent.change(screen.getByLabelText(/promotion promo code/i), {
      target: { value: 'burger10' },
    });
    fireEvent.click(screen.getByLabelText(/promotion requires promo code/i));
    fireEvent.click(screen.getByRole('button', { name: /create promotion/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/burger promo promotion saved/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/BURGER10/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit burger promo/i }));
    fireEvent.change(screen.getByLabelText(/promotion title/i), {
      target: { value: 'Free delivery promo' },
    });
    fireEvent.change(screen.getByLabelText(/promotion discount type/i), {
      target: { value: 'delivery' },
    });
    fireEvent.click(screen.getByLabelText(/promotion requires promo code/i));
    fireEvent.click(screen.getByRole('button', { name: /save promotion/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/free delivery promo promotion saved/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/auto-apply/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /delete free delivery promo/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/free delivery promo promotion deleted/i)
      ).toBeInTheDocument();
    });
  });

  it('renders the settlement ledger and records a manual adjustment', async () => {
    render(
      <App
        initialEntries={['/ops/settlements']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(
        /ledger-based reconciliation and manual adjustments/i
      )
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('textbox', { name: /settlement adjustment amount/i }),
      { target: { value: '-375' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: /settlement adjustment notes/i }),
      { target: { value: 'Customer compensation after late rider arrival.' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: /issue settlement adjustment/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/adjustment -3\.75 sar recorded/i)
      ).toBeInTheDocument();
    });
  });

  it('hides settlement adjustment actions when the ops user lacks settlement manage scope', async () => {
    render(
      <App
        initialEntries={['/ops/settlements']}
        initialSession={{
          ...defaultOpsSession,
          permissions: defaultOpsSession.permissions.filter(
            (permission) => permission !== 'ops:settlements.manage'
          ),
        }}
      />
    );

    expect(
      await screen.findByText(
        /ledger-based reconciliation and manual adjustments/i
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /issue settlement adjustment/i })
    ).not.toBeInTheDocument();
  });

  it('lets support search orders, add a note, and cancel the focused case', async () => {
    render(
      <App
        initialEntries={['/ops/support']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(
        /search orders, add notes, and watch outbound comms/i
      )
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('textbox', { name: /search support orders/i }),
      {
        target: { value: 'Sara' },
      }
    );

    expect(
      await screen.findByTestId(
        'support-order-4aa0f507-77b6-459c-adbe-ef8658cbdc51'
      )
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/support case summary/i), {
      target: { value: 'Merchant callback required before cancellation.' },
    });
    fireEvent.change(screen.getByLabelText(/support case issue type/i), {
      target: { value: 'merchant_issue' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save support case/i }));

    await waitFor(() => {
      expect(screen.getByText(/support case .* saved as/i)).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByRole('textbox', { name: /support note body/i }),
      {
        target: {
          value: 'Customer confirmed they can take the handoff downstairs.',
        },
      }
    );

    fireEvent.click(screen.getByRole('button', { name: /add support note/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/support note added for 4AA0F507/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/support cancellation reason/i), {
      target: { value: 'out_of_stock' },
    });
    fireEvent.change(screen.getByLabelText(/support cancellation note/i), {
      target: {
        value: 'Merchant confirmed the burger line is unavailable tonight.',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /^cancel order$/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/^cancelled$/i).length).toBeGreaterThan(0);
    });
  });

  it('lets ops retry failed notifications from the support console', async () => {
    render(
      <App
        initialEntries={['/ops/support']}
        initialSession={defaultOpsSession}
      />
    );

    expect(
      await screen.findByText(
        /the push notification transport is configured to fail/i
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Support updated your order - Push/i)
    ).toBeInTheDocument();
    expect(
      (await screen.findAllByText(/Customer - Sara Al-Qahtani/i)).length
    ).toBeGreaterThan(0);
    expect(
      await screen.findByText(/Failed via failing - attempt 2 - 4AA0F507/i)
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /retry notification/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/notification retry completed for 4AA0F507 via log/i)
      ).toBeInTheDocument();
    });
  });
});
