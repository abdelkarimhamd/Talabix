export const fallbackLocale = 'en';

export const supportedLocales = ['en', 'ar'];

export const localeMetadata = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    intlLocale: 'en-US',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    intlLocale: 'ar-SA',
  },
};

export const translations = {
  en: {
    common: {
      actions: {
        cancel: 'Cancel',
        close: 'Close',
        continue: 'Continue',
        create: 'Create',
        edit: 'Edit',
        refresh: 'Refresh',
        save: 'Save',
        search: 'Search',
        submit: 'Submit',
        update: 'Update',
      },
      language: {
        english: 'English',
        englishNative: 'English',
        arabic: 'Arabic',
        arabicNative: 'العربية',
        switcherLabel: 'Language',
      },
      skipToMain: 'Skip to main content',
      loading: 'Loading',
      unavailable: 'Unavailable',
      total: '{count} total',
      unread: '{count} unread',
    },
    auth: {
      adminAccess: 'Admin access',
      loginTitle: 'Sign in to Talabix ops',
      loginBody:
        'Use an active ops admin account to open dispatch, support, configuration, and settlement tools.',
      emailLabel: 'Email address',
      passwordLabel: 'Password',
      signIn: 'Sign in',
      signingIn: 'Signing in...',
      signOut: 'Sign out',
      loginFailed: 'Sign-in failed. Check the account and password.',
      accessBlocked: 'Access blocked',
      notAuthorized: 'Not authorized for this route',
      routeScopeHelp:
        'The portal renders shared code, but route groups and ability scopes stay strict. Switch to a session that owns this path to continue.',
    },
    navigation: {
      primary: 'Primary',
      merchantOrders: 'Merchant Orders',
      merchantCatalog: 'Merchant Catalog',
      merchantPromotions: 'Merchant Promotions',
      merchantReports: 'Merchant Reports',
      merchantInbox: 'Merchant Inbox',
      opsDashboard: 'Ops Dashboard',
      accountSecurity: 'Account Security',
      opsUsers: 'Ops Users',
      opsConfiguration: 'Ops Configuration',
      opsPromotions: 'Promotion Offers',
      dispatchBoard: 'Dispatch Board',
      supportConsole: 'Support Console',
      settlementLedger: 'Settlement Ledger',
      badges: {
        live: 'Live',
        scoped: 'Scoped',
        sales: 'Sales',
        inbox: 'Inbox',
        kpi: 'KPI',
        config: 'Config',
        offers: 'Offers',
        ops: 'Ops',
        audit: 'Audit',
        finance: 'Finance',
        security: 'Security',
        users: 'Users',
      },
    },
    portal: {
      brandMark: 'T',
      deliveryControl: 'Delivery control',
      title: 'Talabix portal',
      summary:
        'One React shell, split by actor routes and permissions so merchant staff and ops teams share infrastructure without sharing scope.',
      activeSession: 'Active session',
      actorSwitcher: 'Actor session',
      merchantSession: 'Merchant',
      opsSession: 'Ops',
      switchToMerchantSession: 'Switch to merchant session',
      switchToOpsSession: 'Switch to ops session',
      routePartitioning: 'Route partitioning',
      heroTitle: 'Realtime boards without cross-actor leakage.',
      heroBody:
        'The portal keeps merchant order operations and internal ops tools in one codebase, while policy-aware route guards and scoped abilities decide who can see or mutate each slice.',
      namespaces: 'Namespaces',
      actorApis: '4 actor APIs',
      actorApisBody:
        '/customer, /merchant, /rider, and /ops share one Laravel backend.',
      contracts: 'Contracts',
      sharedValidators: 'Shared validators',
      sharedValidatorsBody:
        'Zod schemas, channel names, and ability constants come from one package.',
    },
    customer: {
      navigation: {
        home: 'Home',
        orders: 'Orders',
        offers: 'Offers',
        points: 'Points',
        profile: 'Profile',
      },
      home: {
        eyebrow: 'Customer discovery',
        title: 'Customer identity and discovery now run as one slice.',
        description:
          'Register a customer, keep a richer address book, filter discovery by serviceability, and open merchant detail before continuing into catalog and cart.',
        signedInCustomer: 'Signed-in customer',
        signedInDescription:
          'The shared contract package now drives registration, profile updates, address payloads, and merchant discovery responses.',
        loadingSession: 'Loading customer session',
        emailLoading: 'email loading',
        phoneLoading: 'phone loading',
        roleLoading: 'role loading',
        roleLabel: '{role} role',
        discoveryContext: 'Discovery context',
        discoveryContextDescription:
          'Discovery uses the selected default or manually chosen address so the merchant list only shows serviceable results.',
        selectAddress: 'Select a delivery address',
        createAddressHelp:
          'Create an address to unlock serviceability-aware discovery.',
        defaultAddress: '{label} default',
        filters: 'Filters',
        discoveryTitle: 'Address-aware merchant discovery',
        discoveryDescription:
          'Search stays merchant-name-based in this phase, open-now uses each branch schedule, and ETA stays provider-driven instead of hard-coded.',
        searchMerchants: 'Search merchants',
        searchPlaceholder: 'Search restaurants, markets...',
        openNowOn: 'Open now only: on',
        openNowOff: 'Open now only: off',
        openNowOnly: 'Open now only',
        openNow: 'Open now',
        closedNow: 'Closed right now',
        deliveryFee: '{amount} delivery from the nearest serviceable branch.',
        projectedServiceability:
          'Serviceability and branch open-state are projected from the selected address.',
        visibleBranches: '{count} visible branch',
        visibleBranches_plural: '{count} visible branches',
        serviceableCount: '{count} serviceable',
        notServiceable: 'Not serviceable',
        eta: '{minutes} min ETA',
        etaVia: '{minutes} min ETA via {provider}',
        noActiveBranches: 'No active branches match the current filters.',
        noMerchants: 'No merchants',
        noMerchantsTitle: 'No merchants match the current address and filters.',
        noMerchantsDescription:
          'Try a broader search or turn off the open-now filter.',
        noMerchantsBody:
          'Merchant discovery is intentionally constrained to serviceable branches only when an address is selected.',
        inbox: 'Inbox',
        inboxDescription:
          'In-app delivery and support notifications now stay actor-scoped, so the customer app can surface unread operational updates without relying on email or push state.',
        unreadNotifications: '{count} unread notification',
        unreadNotifications_plural: '{count} unread notifications',
        loadingInbox: 'Loading inbox',
        emptyInbox:
          'Order and support notifications will appear here once they are queued for the signed-in customer.',
        activeOrder: 'Active order',
        activeOrderDescription:
          'The live order card still mirrors the append-only timeline so the new discovery flow drops into the existing order shell without changing checkout semantics.',
        trackOrder: 'Track order {code}',
        preparingOrder: 'Preparing live order',
        loadingOrder: 'Loading order status',
        lifecycleEvents:
          '{count} projected lifecycle events visible on-device.',
        waitingOrder: 'Waiting for order data.',
        routes: 'Routes',
        routesTitle: 'Continue the customer flow',
        routesDescription:
          'Profile, registration, addresses, cart, and live order tracking stay as separate routes while sharing the same query client and contract package.',
        promoBannerEyebrow: 'Limited time',
        promoBannerTitle: 'Free delivery today',
        promoBannerDescription: 'On orders over SAR 40 from top restaurants.',
        dailyOffersTitle: 'Daily offers',
        categoryPickerTitle: 'What do you need?',
        prototypeKicker: 'Good morning',
        prototypeTitle: 'What would you like?',
        prototypeDescription: 'Delivering to your saved addresses',
        categoriesTitle: 'Categories',
        nearbyRestaurantsTitle: 'Nearby restaurants',
        topRatedTitle: 'Top Rated',
        allNearbyTitle: 'All nearby',
        newNotifications: '{count} new',
        optionCount: '{count} option',
        optionCount_plural: '{count} options',
        defaultLabel: 'Default',
        useLabel: 'Use',
        nearbyLabel: 'Nearby',
        updatesEyebrow: 'Updates',
        updatesDescription:
          'Order updates and support replies appear here first.',
        moreEyebrow: 'More',
        moreTitle: 'Keep shopping',
        moreDescription:
          'Profile, addresses, notifications, cart, and live tracking.',
        addressLabels: {
          home: 'Home',
          work: 'Work',
          office: 'Office',
        },
        categories: {
          all: {
            label: 'All',
            meta: 'Near you',
            icon: 'apps',
          },
          restaurants: {
            label: 'Restaurants',
            meta: 'Meals & cafes',
            icon: 'silverware-fork-knife',
          },
          market: {
            label: 'Market',
            meta: 'Groceries',
            icon: 'basket-outline',
          },
          pharmacy: {
            label: 'Pharmacy',
            meta: 'Care items',
            icon: 'medical-bag',
          },
          gifts: {
            label: 'Flowers & gifts',
            meta: 'Same day',
            icon: 'gift-outline',
          },
          pickup: {
            label: 'Pickup',
            meta: 'Branch ready',
            icon: 'shopping-outline',
          },
        },
        offers: {
          discountBadge: '35% off',
          discountTitle: 'Special discounts',
          discountMeta: 'Selected meals',
          freeBadge: '0 SAR',
          freeTitle: 'Free delivery',
          freeMeta: 'HPlus stores',
          quickBadge: '20 min',
          quickTitle: 'Quick refill',
          quickMeta: 'Market baskets',
        },
      },
      merchant: {
        screenDescription:
          'Browse serviceable branches, compare ETA and delivery fee, then open the menu for the branch that fits the order.',
        screenEyebrow: 'Store profile',
        screenTitle: 'Store profile',
        loadingTitle: 'Loading merchant detail',
        fallbackMerchant: 'Talabix merchant',
        openNow: 'Open now',
        closedNow: 'Closed now',
        discountBadge: '30% off',
        pageKicker: 'Store profile',
        deliveryBadge: 'Delivery 15-30 min',
        freeDeliveryBadge: 'Free delivery picks',
        delivery: 'Delivery',
        pickup: 'Pick-up',
        deliverTo: 'Deliver to',
        defaultAddress: '{label} default',
        summaryEyebrow: 'Merchant summary',
        summaryDescription:
          'Choose a branch with a clear ETA and delivery fee.',
        loadingSummary: 'Loading summary',
        serviceableBranches: '{count} serviceable branch',
        serviceableBranches_plural: '{count} serviceable branches',
        notServiceable: 'Not serviceable',
        chooseBranch: 'Choose a branch',
        serviceableBranch: 'Serviceable branch',
        outOfRange: 'Out of range',
        eta: '{minutes} min ETA',
        etaVia: '{minutes} min ETA via {provider}',
        deliveryFee: '{amount} delivery',
        distanceFromAddress: '{distance}m from the selected address.',
        selectAddressForServiceability:
          'Select an address to see serviceability.',
        menuTitle: 'Menu',
        addedToCart: '{item} added to cart.',
        back: 'Back',
      },
      cart: {
        screenDescription:
          'Review item quantities, delivery address, notes, and COD totals before creating the order.',
        screenEyebrow: 'Checkout',
        screenTitle: 'Your Talabix cart',
        pageKicker: 'Your order',
        pageTitle: 'Cart',
        checkoutNotesUpdated: 'Checkout notes updated.',
        promoApplied: 'Promo code {code} applied.',
        promoInvalid: 'Promo code is not valid for this cart.',
        orderCreated: 'Order {code} created.',
        notReady: 'Cart is not ready for checkout.',
        branchPrompt: 'Pick a branch from merchant discovery to start a cart.',
        deliveryOrder: 'Delivery order',
        itemCount: '{count} cart item',
        itemCount_plural: '{count} cart items',
        loadingCart: 'Loading cart',
        items: 'Items',
        itemDescription: '{count} item at {amount} each',
        itemDescription_plural: '{count} items at {amount} each',
        cartItem: 'Cart item',
        lineTotal: 'Line total',
        removing: 'Removing',
        removeOne: 'Remove one',
        qty: 'Qty {count}',
        adding: 'Adding',
        addOne: 'Add one',
        emptyDescription:
          'Browse a branch catalog to add items before checking out.',
        emptyEyebrow: 'Empty cart',
        emptyTitle: 'Cart is currently empty',
        deliveryContext: 'Delivery context',
        deliveryContextDescription:
          'Checkout uses the current default address from the address book.',
        addDefaultAddress: 'Add a default address first',
        noAddress: 'No address available for checkout.',
        noBranch: 'No branch selected',
        noStore: 'No store selected',
        cod: 'COD',
        paymentSummary: 'Payment summary',
        paymentSummaryDescription:
          'COD only in v1, with pricing and delivery fee locked into the order snapshot.',
        deliveryNotes: 'Delivery notes',
        promoCode: 'Promo code',
        applying: 'Applying',
        applyPromo: 'Apply promo',
        subtotal: 'Subtotal',
        deliveryFee: 'Delivery fee',
        offerSavings: 'Offer savings',
        freeDelivery: 'Free delivery',
        totalDiscounts: 'Total discounts',
        total: 'Total',
        placingOrder: 'Placing order',
        placeCodOrder: 'Place COD order',
        checkout: 'Checkout',
        back: 'Back',
      },
      tracking: {
        screenDescription:
          'Realtime order updates map directly to the append-only order timeline and actor-specific broadcast channels.',
        screenEyebrow: 'Live tracking',
        screenTitle: 'Talabix order tracking',
        englishScreenTitle: 'Talabix order tracking',
        englishExceptionEyebrow: 'Delivery issue reported',
        pageKicker: 'Live tracking',
        pageTitle: 'Tracking your delivery',
        currentStatus: 'Current status',
        promoDescription: 'Order {code}',
        promoLoadingCode: 'loading',
        summaryDescription:
          'The app keeps a simple status tracker so customers can see where the order is without reading the raw timeline.',
        summaryEyebrow: 'Tracking summary',
        loadingStatus: 'Loading status',
        orderTotal: 'Order total',
        lifecycleEvents: '{count} lifecycle event visible on-device.',
        lifecycleEvents_plural: '{count} lifecycle events visible on-device.',
        waitingEvents: 'Waiting for tracking events.',
        cod: 'COD',
        exceptionDescription: 'Support is monitoring the delivery issue.',
        exceptionEyebrow: 'Delivery issue reported',
        riderReported: 'The rider reported {reason}.',
        orderTimeline: 'Order timeline',
        liveStatusUpdates: 'Live status updates',
        completed: 'completed',
        waiting: 'waiting',
        done: 'Done',
        next: 'Next',
        stepNumber: 'Step {number}',
        rawTimeline: 'Timeline',
        timestampPending: 'timestamp pending',
        timelineEvent: 'Timeline event',
        waitingOrderData: 'Waiting for order data.',
        priceBreakdown: 'Price breakdown',
      },
      catalog: {
        screenDescription:
          'Browse menu sections, customize modifiers, and keep a cart summary visible before checkout.',
        screenEyebrow: 'Menu',
        screenTitle: 'Branch menu',
        pageKicker: 'Menu',
        pageTitle: 'Branch menu',
        currentOffer: 'the current offer',
        highlightedDescription: '{item} is selected from {offer}.',
        defaultDescription:
          'Modifiers are priced before checkout so every cart line keeps a clear order snapshot.',
        offerSelected: 'Offer selected',
        fastAdd: 'Fast add',
        highlightedTitle: 'Add the offer item to your cart',
        defaultTitle: 'Pick favorites, adjust options, then continue to cart',
        categories: 'Categories',
        allItems: 'All items',
        itemInSection: '{count} item in this menu section.',
        itemInSection_plural: '{count} items in this menu section.',
        selectedOfferItem: 'Selected offer item',
        catalogItem: 'Catalog item',
        offer: 'Offer',
        discountBadge: '30% off',
        itemPrice: 'Item price',
        modifierSelectionCount: '{count} modifier selection active',
        modifierSelectionCount_plural: '{count} modifier selections active',
        offerItem: 'Offer item',
        pickOne: 'pick one',
        pickUpTo: 'pick up to {count}',
        pickUpToMany: 'pick up to many',
        addToCart: 'Add to cart',
        noItemsDescription: 'This branch does not have seeded demo items yet.',
        noItemsEyebrow: 'No items',
        noItemsTitle: 'Catalog preview unavailable',
        cartDescription: 'Modifier selections stay attached to each cart line.',
        cartEyebrow: 'Current cart',
        cartItemCount: '{count} cart item',
        cartItemCount_plural: '{count} cart items',
        subtotal: 'Subtotal',
        delivery: 'Delivery',
        offerDiscounts: 'Offer discounts',
        total: 'Total',
        openCart: 'Open cart',
      },
      notifications: {
        screenDescription:
          'The customer inbox is backed by in-app delivery records only, so read-state stays separate from email or push delivery attempts.',
        screenEyebrow: 'Customer inbox',
        screenTitle:
          'Notification history stays attached to real order updates.',
        pageKicker: 'Customer inbox',
        pageTitle: 'Notification history stays attached to real order updates.',
        updateFailed: 'Notification could not be updated.',
        markedRead: 'Marked {title} as read.',
        unreadFilterDescription:
          "Unread filtering is actor-scoped and only returns the current customer's in-app rows.",
        inboxState: 'Inbox state',
        unreadSummary: '{unread} unread of {total}',
        loading: 'Loading notifications',
        unreadOnlyOn: 'Unread only: on',
        unreadOnlyOff: 'Unread only: off',
        readEyebrow: 'Read',
        unreadEyebrow: 'Unread',
        general: 'General',
        read: 'read',
        unread: 'unread',
        queuedAt: 'Queued {time}',
        queuedUnavailable: 'Queued timestamp unavailable.',
        marking: 'Marking...',
        markRead: 'Mark read',
        emptyDescription:
          'Unread filtering may hide notifications that were already acknowledged.',
        emptyEyebrow: 'Inbox empty',
        emptyTitle: 'No notifications match the current filter.',
        emptyBody:
          'Customer inbox state is driven from the same order-linked notification records used by the backend actor routes.',
      },
      offers: {
        screenDescription:
          'Browse customer-facing promotions from the offers API, with packaged artwork and branch-aware item metadata.',
        screenEyebrow: 'Offers',
        screenTitle: 'Offers near you',
        pageKicker: 'Offers',
        pageTitle: 'Offers near you',
        limitedTime: 'Limited time',
        promoDescription:
          'Selected restaurants, markets, and member-style bundles are refreshed from the offers list.',
        promoEyebrow: 'Today',
        promoTitle: 'Deals ready for your next order',
        apiDescription:
          'The offer cards below are no longer a fixed branch catalog shortcut.',
        apiEyebrow: 'Offers API',
        activeOfferCount: '{count} active offer',
        activeOfferCount_plural: '{count} active offers',
        packagedArtwork: 'Packaged artwork',
        branchAware: 'Branch-aware',
        availableOffers: 'Available offers',
        minimumSpend: 'Minimum spend',
        deliveryFee: 'Delivery fee',
        expires: 'Expires {date}',
        code: 'Code {code}',
        viewOffer: 'View offer',
        empty: 'No active customer offers are available right now.',
        offerCopy: {
          'free-delivery-shawarma': {
            title: 'Free delivery',
            description:
              'No delivery fee on selected wraps from Olaya Branch during dinner.',
            discountLabel: '0 SAR delivery',
            itemName: 'Chicken Shawarma',
            branchName: 'Olaya Branch',
          },
          'market-basket-save': {
            title: 'Save on market baskets',
            description:
              'Bundle home essentials from Talabix Market and get an instant discount.',
            discountLabel: '20% off',
            itemName: 'Fresh Market Basket',
            branchName: 'Quick Market Branch',
          },
          'morning-coffee-pack': {
            title: 'Coffee pack deal',
            description:
              'Add cold coffee to a breakfast or market order at a better price.',
            discountLabel: 'SAR 8 off',
            itemName: 'Cold Coffee Pack',
            branchName: 'Quick Market Branch',
          },
        },
      },
      orders: {
        screenDescription:
          'Review active and previous purchases from the customer order history API.',
        screenEyebrow: 'Orders',
        screenTitle: 'Order history',
        pageKicker: 'Orders',
        pageTitle: 'Order history',
        datePending: 'Date pending',
        itemCount: '{count} item',
        itemCount_plural: '{count} items',
        searchPlaceholder: 'Search for items or store',
        activeOrderDescription: 'Order {code} is {status}.',
        noActiveDescription: 'Previous purchases stay ready for quick reorder.',
        latestOrder: 'Latest order',
        noActiveDelivery: 'No active delivery',
        historyDescription:
          'Active and past orders are ready for quick reorder.',
        historyEyebrow: 'History API',
        recentOrders: '{count} recent order',
        recentOrders_plural: '{count} recent orders',
        activeAndPast: 'Active and past orders',
        reorderReady: 'Reorder-ready',
        orders: 'Orders',
        tracking: 'Tracking',
        pastOrder: 'Past order',
        orderCode: 'Order {code}',
        reordering: 'Reordering...',
        trackOrder: 'Track order',
        reorder: 'Reorder',
        empty: 'No order history is available for this customer yet.',
        branchNames: {
          'Olaya Branch': 'Olaya Branch',
        },
      },
      points: {
        screenDescription:
          'Track HPlus rewards, free delivery progress, and voucher-style benefits in the same dock destination.',
        screenEyebrow: 'HPlus rewards',
        screenTitle: '9000 points',
        pageKicker: 'HPlus rewards',
        pageTitle: '9000 points',
        promoDescription:
          'Spend SAR 30 with eligible stores to unlock the next free-delivery reward.',
        previewDescription:
          'This mirrors the reference loyalty surface until the backend exposes a dedicated rewards ledger.',
        freeDeliveryProgress: 'Free delivery progress',
        addMore: 'Add SAR 15 more',
        currentSpend: 'Current spend',
        rewardThreshold: 'Reward threshold',
        autoApply: 'Auto apply',
        vouchersDescription:
          'Vouchers and points use local preview data here so the dock target feels complete while rewards APIs are pending.',
        vouchers: 'Vouchers',
        rewardsSoon: '2 rewards ready soon',
        voucherBody:
          'Free delivery, selected item discounts, and member perks will land in this screen.',
      },
      profile: {
        screenDescription:
          'Customer profile editing stays intentionally small in this slice: name and phone are writable, and the same payload shape is used by the backend patch endpoint.',
        screenEyebrow: 'Customer profile',
        screenTitle: 'Update profile basics',
        saved: 'Saved profile for {name}.',
        reviewDetails: 'Please review the profile details.',
        waitingCustomer: 'Waiting for the current customer.',
        account: 'Account',
        loadingProfile: 'Loading profile',
        walletHPlus: 'HPlus',
        walletPay: 'HPay',
        walletRewards: 'Rewards',
        walletVouchers: 'Vouchers',
        accountDescription: 'Manage addresses, alerts, invoices, and help.',
        currentAccount: 'Current account',
        signedInAccount: 'Signed-in account',
        roles: 'Roles: {roles}',
        myProfile: 'My profile',
        active: 'Active',
        favorites: 'My favorites',
        invoices: 'Invoices',
        notifications: 'Notifications',
        settings: 'Settings',
        help: 'Help & Support',
        formDescription:
          'Keep your contact details ready for delivery updates.',
        profileForm: 'Profile form',
        editNamePhone: 'Edit name and phone',
        fullName: 'Full name',
        phone: 'Phone',
        saving: 'Saving profile',
        save: 'Save profile',
      },
      registration: {
        screenDescription:
          'Customer registration issues the same token-and-user envelope as login, so the mobile shell can move straight into discovery and profile editing.',
        screenEyebrow: 'Customer registration',
        screenTitle: 'Create or replace the current customer session',
        pageKicker: 'Customer registration',
        pageTitle: 'Create or replace the current customer session',
        registered: 'Registered {email}.',
        reviewDetails: 'Please review the registration details.',
        sessionDescription:
          'The mobile form validates against the same register schema mirrored in the shared package.',
        currentSession: 'Current session',
        noCustomerLoaded: 'No customer loaded',
        sessionLoading: 'Customer session is loading.',
        issuedToken: 'Issued token',
        formDescription:
          'Email/password stays the only auth mode in this phase, and the customer role is implicit on successful registration.',
        registrationForm: 'Registration form',
        registerCredentials: 'Register customer credentials',
        fullName: 'Full name',
        email: 'Email',
        phone: 'Phone',
        deviceName: 'Device name',
        password: 'Password',
        confirmPassword: 'Confirm password',
        createAccount: 'Create customer account',
        resetForm: 'Reset form',
      },
      addressBook: {
        screenDescription:
          'Addresses now capture richer branch-serviceability context, keep one default address in play, and support map-driven place search before manual edits.',
        screenEyebrow: 'Address book',
        screenTitle: 'Saved drop-off points with richer delivery detail',
        chooseAddress: 'Choose your delivery address',
        deliveryAddress: 'Delivery address',
        selectedAddress: 'Selected address',
        savedAddress: 'Saved address',
        selected: 'Selected',
        use: 'Use',
        addressUpdated: 'Address updated.',
        addressCreated: 'Address created.',
        reviewFields: 'Please review the address fields.',
        defaultUpdated: 'Default address updated.',
        suggestionApplied: 'Applied {title} from map search.',
        placePickerDescription:
          'Search for a place, add delivery notes, then save it to your address book.',
        placePicker: 'Map place picker',
        updateSavedAddress: 'Update saved address',
        pickPlaceTitle: 'Pick a place, then save the address',
        searchPlaces: 'Search places',
        usePlace: 'Use {label}',
        noSuggestions:
          'No map suggestions match the current query. You can still enter the address and coordinates manually.',
        label: 'Label',
        addressLine1: 'Address line 1',
        addressLine2: 'Address line 2',
        building: 'Building',
        floorLabel: 'Floor',
        apartmentLabel: 'Apartment',
        landmarkLabel: 'Landmark',
        deliveryNotes: 'Delivery notes',
        city: 'City',
        latitude: 'Latitude',
        longitude: 'Longitude',
        defaultOn: 'Default on',
        markDefault: 'Mark as default',
        saving: 'Saving address',
        saveChanges: 'Save address changes',
        createSaved: 'Create saved address',
        cancelEdit: 'Cancel edit',
        defaultAddress: 'Default address',
        floor: 'Floor {floor}',
        unit: 'Unit {apartment}',
        landmark: 'Landmark: {landmark}',
        noLandmark: 'No landmark saved yet.',
        notes: 'Notes: {notes}',
        noNotes: 'No delivery notes saved.',
        edit: 'Edit',
        makingDefault: 'Making default',
        makeDefault: 'Make default',
        useCurrentLocation: 'Use current location',
        findingCurrentLocation: 'Finding current location',
        locationHelp:
          'Use current GPS to fill latitude and longitude only. You can still edit every address field before saving.',
        locationApplied:
          'Current GPS coordinates added. Review the address details before saving.',
        locationPermissionDenied:
          'Location permission is turned off. Enable it in system settings or enter the coordinates manually.',
        locationUnavailable:
          'Current location is unavailable right now. Enter the coordinates manually or try again.',
      },
    },
    rider: {
      home: {
        eyebrow: 'Rider app',
        title: 'Delivery flow optimized for one active order at a time.',
        description:
          'Availability, assignment intake, pickup confirmation, and delivery proof now move through one rider-specific flow that matches the backend lifecycle.',
        activeAssignment: 'Active assignment',
        waitingDispatch: 'Waiting for dispatch',
        activeStops: '{count} active stop',
        activeStops_plural: '{count} active stops',
        customerDropoff: 'Customer {customer} - Drop-off {dropoff}',
        waitingDispatchData: 'Waiting for dispatch data.',
        nextAction: 'Next: {action}',
        inbox: 'Inbox',
        inboxDescription:
          "Assignment and support updates now surface through the rider's in-app inbox, separate from push delivery state.",
        unreadNotifications: '{count} unread notification',
        unreadNotifications_plural: '{count} unread notifications',
        loadingInbox: 'Loading rider inbox',
        emptyInbox:
          'Dispatch and support notifications will appear here for the active rider session.',
        availability: 'Availability',
        availabilityDescription:
          'The rider shell mirrors the dispatch assumptions from the backend: no batching, no route optimization, no stacked orders in v1.',
        availabilityHelp:
          'Toggle online state, then accept, pick up, deliver, and capture proof.',
        goAvailable: 'Go available',
        goOffline: 'Go offline',
        updatingAvailability: 'Updating availability',
        availabilityUpdateFailed: 'Availability could not be updated.',
        availabilityUpdated: 'Availability updated to {availability}.',
        nextSteps: 'Next steps',
        riderActions: 'Rider actions',
        nextStepsDescription:
          'Route files stay in Expo Router, while the screens stay testable as plain React Native components with one mutable assignment state.',
      },
    },
    ops: {
      dashboard: {
        eyebrow: 'Ops dashboard',
        title:
          'Marketplace KPI view across orders, finance, and rider earnings',
        activeOrders: '{count} active orders',
        rangeLabel: 'Select ops dashboard range',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        grossSales: 'Gross sales',
        grossSalesDescription:
          'Non-cancelled order subtotal across the selected reporting window.',
        platformNet: 'Platform net',
        platformNetDescription:
          'Commission plus adjustments, kept separate from merchant and rider liabilities.',
        riderEarnings: 'Rider earnings',
        riderEarningsDescription:
          'Total rider payout liability generated by delivered orders in range.',
        kpiSummary: 'KPI summary',
        orderFleetHealth: 'Order and fleet health',
        totalOrders: 'Total orders',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        activeMerchants: 'Active merchants',
        acceptingBranches: 'Accepting branches',
        availableRiders: 'Available riders',
        statusBreakdown: 'Status breakdown',
        orderStateMix: 'Order state mix',
        status: 'Status',
        count: 'Count',
        merchantSales: 'Merchant sales',
        merchantRanking: 'Merchant ranking',
        merchant: 'Merchant',
        orders: 'Orders',
        payoutExposure: 'Payout exposure',
        rider: 'Rider',
        deliveries: 'Deliveries',
        earnings: 'Earnings',
        averageDelivery: 'Avg / delivery',
        dailyTrend: 'Daily trend',
        orderVolumeByDay: 'Order volume by day',
        date: 'Date',
        loadingTitle: 'Loading dashboard',
        loadingDescription:
          'The overview aggregates orders, ledger rows, and rider availability in one response.',
      },
      accountSecurity: {
        eyebrow: 'Account security',
        title: 'Change your ops password',
        security: 'Security',
        passwordForm: 'Password',
        passwordFormTitle: 'Update sign-in credentials',
        description:
          'Use your current password to set a new ops portal password. Other active sessions are signed out after the change.',
        currentPassword: 'Current password',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
        updatePassword: 'Update password',
        updatingPassword: 'Updating password',
        success: 'Password updated successfully.',
        mismatch: 'The new passwords must match.',
        review: 'Review the password fields and try again.',
        sessionOwner: 'Signed-in account',
        signedInAs: 'Signed in as {email}.',
        noStoredUser: 'Demo session with no stored live account.',
        passwordPolicy: 'Password policy',
        passwordPolicyTitle: 'Use at least 8 characters',
        passwordPolicyCopy:
          'Choose a password that is not reused for hosting, email, or SSH access.',
        otherSessions:
          'After the update, any other portal tokens for this account are revoked.',
      },
      userManagement: {
        eyebrow: 'Ops user management',
        title: 'Invite and disable ops users',
        totalUsers: '{count} users',
        inviteEyebrow: 'Invite',
        inviteTitle: 'Create an ops login',
        inviteDescription:
          'Super admins can create a scoped ops user with a temporary password, then disable or reactivate access without SSH.',
        name: 'Name',
        email: 'Email address',
        phoneOptional: 'Phone number',
        role: 'Role',
        status: 'Status',
        temporaryPassword: 'Temporary password',
        confirmTemporaryPassword: 'Confirm temporary password',
        inviteUser: 'Invite ops user',
        inviting: 'Inviting user',
        inviteSuccess: '{name} was invited.',
        inviteFailed: 'Ops user could not be invited.',
        directoryEyebrow: 'Directory',
        directoryTitle: 'Scoped portal access',
        directoryDescription:
          'Only active ops users with an ops role can sign in to the portal. Suspended users lose active tokens.',
        currentAdmin: 'Current admin',
        currentAdminDescription: 'Managing users as {email}.',
        demoAdminDescription: 'Demo mode keeps changes inside the browser.',
        userDirectory: 'User directory',
        userDirectoryTitle: 'Ops users',
        loadingTitle: 'Loading ops users',
        loadingDescription: 'Fetching current ops roles and account status.',
        noUsersTitle: 'No ops users found',
        noUsersDescription: 'Invite the first ops user to start the directory.',
        saveUser: 'Save user',
        saving: 'Saving',
        disableUser: 'Disable user',
        reactivateUser: 'Reactivate user',
        currentUser: 'You',
        updateSuccess: '{name} was updated.',
        updateFailed: 'Ops user could not be updated.',
        createdAt: 'Created',
        lastLogin: 'Last login',
        never: 'Never',
        roles: {
          opsAdmin: 'Super admin',
          opsDispatcher: 'Dispatcher',
          opsSupport: 'Support',
        },
        statuses: {
          active: 'Active',
          suspended: 'Suspended',
          pending: 'Pending',
        },
      },
    },
    orders: {
      orderCode: 'Order {code}',
    },
    enums: {
      orderStatus: {
        placed: 'Placed',
        accepted: 'Accepted',
        preparing: 'Preparing',
        ready_for_pickup: 'Ready for pickup',
        assigned: 'Assigned',
        picked_up: 'Picked up',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
      },
      orderTimelineEventType: {
        order_placed: 'Order placed',
        merchant_accepted: 'Merchant accepted',
        merchant_rejected: 'Merchant rejected',
        dispatch_started: 'Dispatch started',
        rider_assigned: 'Rider assigned',
        rider_reassigned: 'Rider reassigned',
        picked_up: 'Picked up',
        delivery_exception_reported: 'Delivery issue reported',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        support_note_added: 'Support note added',
      },
      paymentStatus: {
        pending_cod: 'Pending COD',
        collected_cod: 'Collected COD',
        waived: 'Waived',
      },
      riderAvailability: {
        offline: 'Offline',
        available: 'Available',
        busy: 'Busy',
        paused: 'Paused',
      },
      proofType: {
        recipient_confirmation: 'Recipient confirmation',
        photo: 'Photo',
        handoff_code: 'Handoff code',
      },
      deliveryExceptionReason: {
        customer_unreachable: 'Customer unreachable',
        address_issue: 'Address issue',
        merchant_delay: 'Merchant delay',
        vehicle_issue: 'Vehicle issue',
        safety_issue: 'Safety issue',
        other: 'Other',
      },
      notificationType: {
        order_status_updated: 'Order status updated',
        support_note_added: 'Support note added',
      },
      notificationDeliveryStatus: {
        queued: 'Queued',
        sent: 'Sent',
        failed: 'Failed',
      },
      notificationChannel: {
        in_app: 'In-app',
        email: 'Email',
        push: 'Push',
        sms: 'SMS',
      },
      supportCaseStatus: {
        open: 'Open',
        investigating: 'Investigating',
        resolved: 'Resolved',
      },
      supportIssueType: {
        customer_request: 'Customer request',
        delivery_delay: 'Delivery delay',
        address_issue: 'Address issue',
        merchant_issue: 'Merchant issue',
        rider_issue: 'Rider issue',
        order_accuracy: 'Order accuracy',
        payment_issue: 'Payment issue',
        other: 'Other',
      },
      supportResolutionType: {
        customer_contacted: 'Customer contacted',
        merchant_contacted: 'Merchant contacted',
        rider_contacted: 'Rider contacted',
        clarified_instructions: 'Clarified instructions',
        cancelled_order: 'Cancelled order',
        compensation_offered: 'Compensation offered',
        monitoring_only: 'Monitoring only',
        other: 'Other',
      },
      supportCancellationReasonCode: {
        customer_request: 'Customer request',
        merchant_unavailable: 'Merchant unavailable',
        out_of_stock: 'Out of stock',
        address_unserviceable: 'Address unserviceable',
        rider_issue: 'Rider issue',
        duplicate_order: 'Duplicate order',
        fraud_review: 'Fraud review',
        ops_override: 'Ops override',
        other: 'Other',
      },
      actorRole: {
        customer: 'Customer',
        merchant: 'Merchant',
        merchant_manager: 'Merchant manager',
        rider: 'Rider',
        ops_support: 'Ops support',
        system: 'System',
      },
      ledgerEntryType: {
        merchant_receivable: 'Merchant receivable',
        platform_commission: 'Platform commission',
        rider_earning: 'Rider earning',
        adjustment: 'Adjustment',
      },
      auditActionType: {
        order_cancelled: 'Order cancelled',
        rider_reassigned: 'Rider reassigned',
        branch_updated: 'Branch updated',
        catalog_updated: 'Catalog updated',
        settlement_adjusted: 'Settlement adjusted',
        permission_changed: 'Permission changed',
        support_case_updated: 'Support case updated',
        support_note_added: 'Support note added',
        maps_configuration_updated: 'Maps configuration updated',
      },
    },
  },
  ar: {
    common: {
      actions: {
        cancel: 'إلغاء',
        close: 'إغلاق',
        continue: 'متابعة',
        create: 'إنشاء',
        edit: 'تعديل',
        refresh: 'تحديث',
        save: 'حفظ',
        search: 'بحث',
        submit: 'إرسال',
        update: 'تحديث',
      },
      language: {
        english: 'الإنجليزية',
        englishNative: 'English',
        arabic: 'العربية',
        arabicNative: 'العربية',
        switcherLabel: 'اللغة',
      },
      skipToMain: 'تخطي إلى المحتوى الرئيسي',
      loading: 'جار التحميل',
      unavailable: 'غير متاح',
      total: 'الإجمالي {count}',
      unread: 'غير مقروء {count}',
    },
    auth: {
      adminAccess: 'دخول الإدارة',
      loginTitle: 'تسجيل الدخول إلى عمليات طلبكس',
      loginBody:
        'استخدم حساب مدير عمليات نشط لفتح أدوات الإسناد والدعم والإعدادات والتسويات.',
      emailLabel: 'البريد الإلكتروني',
      passwordLabel: 'كلمة المرور',
      signIn: 'تسجيل الدخول',
      signingIn: 'جار تسجيل الدخول...',
      signOut: 'تسجيل الخروج',
      loginFailed: 'تعذر تسجيل الدخول. تحقق من الحساب وكلمة المرور.',
      accessBlocked: 'تم حظر الوصول',
      notAuthorized: 'غير مصرح لهذا المسار',
      routeScopeHelp:
        'تستخدم البوابة نفس الواجهة، لكن مسارات الأدوار وصلاحيات الوصول تبقى منفصلة. بدّل إلى جلسة تملك هذا المسار للمتابعة.',
    },
    navigation: {
      primary: 'التنقل الرئيسي',
      merchantOrders: 'طلبات التاجر',
      merchantCatalog: 'كتالوج التاجر',
      merchantPromotions: 'عروض التاجر',
      merchantReports: 'تقارير التاجر',
      merchantInbox: 'صندوق التاجر',
      opsDashboard: 'لوحة العمليات',
      accountSecurity: 'أمان الحساب',
      opsUsers: 'مستخدمو العمليات',
      opsConfiguration: 'إعدادات العمليات',
      opsPromotions: 'عروض الترويج',
      dispatchBoard: 'لوحة الإسناد',
      supportConsole: 'وحدة الدعم',
      settlementLedger: 'سجل التسويات',
      badges: {
        live: 'مباشر',
        scoped: 'مقيد',
        sales: 'مبيعات',
        inbox: 'صندوق',
        kpi: 'مؤشرات',
        config: 'إعداد',
        offers: 'عروض',
        ops: 'عمليات',
        audit: 'تدقيق',
        finance: 'مالية',
        security: 'أمان',
        users: 'مستخدمون',
      },
    },
    portal: {
      brandMark: 'ت',
      deliveryControl: 'تحكم التوصيل',
      title: 'بوابة طلبكس',
      summary:
        'واجهة React واحدة مقسمة حسب مسارات الأدوار والصلاحيات حتى يعمل فريق التاجر وفريق العمليات على نفس البنية دون خلط نطاقات الوصول.',
      activeSession: 'الجلسة النشطة',
      actorSwitcher: 'جلسة الدور',
      merchantSession: 'التاجر',
      opsSession: 'العمليات',
      switchToMerchantSession: 'التبديل إلى جلسة التاجر',
      switchToOpsSession: 'التبديل إلى جلسة العمليات',
      routePartitioning: 'تقسيم المسارات',
      heroTitle: 'لوحات فورية دون تسريب بين الأدوار.',
      heroBody:
        'تحافظ البوابة على عمليات التاجر وأدوات العمليات الداخلية في قاعدة واحدة، بينما تحدد حراسة المسارات والصلاحيات من يرى أو يعدل كل جزء.',
      namespaces: 'المساحات',
      actorApis: '٤ واجهات API للأدوار',
      actorApisBody:
        'تشترك /customer و /merchant و /rider و /ops في نفس خلفية Laravel.',
      contracts: 'العقود',
      sharedValidators: 'مدققات مشتركة',
      sharedValidatorsBody:
        'تأتي مخططات Zod وأسماء القنوات وثوابت الصلاحيات من حزمة واحدة.',
    },
    customer: {
      navigation: {
        home: 'الرئيسية',
        orders: 'الطلبات',
        offers: 'العروض',
        points: 'النقاط',
        profile: 'الحساب',
      },
      home: {
        eyebrow: 'اكتشاف المتاجر',
        title: 'هوية العميل والاكتشاف يعملان الآن كشريحة واحدة.',
        description:
          'سجّل العميل، واحتفظ بدفتر عناوين مفصل، وصفِّ الاكتشاف حسب قابلية الخدمة، وافتح تفاصيل المتجر قبل المتابعة إلى الكتالوج والسلة.',
        signedInCustomer: 'العميل المسجل',
        signedInDescription:
          'تقود الحزمة المشتركة الآن التسجيل وتحديثات الملف الشخصي وحمولات العنوان وردود اكتشاف المتاجر.',
        loadingSession: 'جار تحميل جلسة العميل',
        emailLoading: 'جار تحميل البريد',
        phoneLoading: 'جار تحميل الهاتف',
        roleLoading: 'جار تحميل الدور',
        roleLabel: 'دور {role}',
        discoveryContext: 'سياق الاكتشاف',
        discoveryContextDescription:
          'يستخدم الاكتشاف العنوان الافتراضي المحدد أو العنوان المختار يدوياً حتى تعرض القائمة المتاجر القابلة للخدمة فقط.',
        selectAddress: 'اختر عنوان التوصيل',
        createAddressHelp: 'أنشئ عنواناً لتفعيل الاكتشاف حسب قابلية الخدمة.',
        defaultAddress: '{label} افتراضي',
        filters: 'الفلاتر',
        discoveryTitle: 'تصفية المتاجر حسب العنوان',
        discoveryDescription:
          'يبقى البحث حسب اسم المتجر في هذه المرحلة، ويستخدم فلتر المفتوح الآن جدول كل فرع، وتبقى مدة الوصول من مزود الخرائط.',
        searchMerchants: 'بحث المتاجر',
        searchPlaceholder: 'ابحث عن مطاعم أو ماركت...',
        openNowOn: 'المفتوح الآن فقط: مفعل',
        openNowOff: 'المفتوح الآن فقط: غير مفعل',
        openNowOnly: 'المفتوح الآن فقط',
        openNow: 'مفتوح الآن',
        closedNow: 'مغلق حالياً',
        deliveryFee: 'رسوم التوصيل {amount} من أقرب فرع قابل للخدمة.',
        projectedServiceability:
          'تُعرض قابلية الخدمة وحالة فتح الفروع من العنوان المحدد.',
        visibleBranches: '{count} فرع ظاهر',
        visibleBranches_plural: '{count} فروع ظاهرة',
        serviceableCount: '{count} قابل للخدمة',
        notServiceable: 'غير قابل للخدمة',
        eta: '{minutes} دقيقة للوصول',
        etaVia: '{minutes} دقيقة للوصول عبر {provider}',
        noActiveBranches: 'لا توجد فروع نشطة تطابق الفلاتر الحالية.',
        noMerchants: 'لا توجد متاجر',
        noMerchantsTitle: 'لا توجد متاجر تطابق العنوان والفلاتر الحالية.',
        noMerchantsDescription: 'جرّب بحثاً أوسع أو أوقف فلتر المفتوح الآن.',
        noMerchantsBody:
          'اكتشاف المتاجر مقيد عمداً بالفروع القابلة للخدمة فقط عند اختيار عنوان.',
        inbox: 'الصندوق',
        inboxDescription:
          'تبقى إشعارات التوصيل والدعم داخل التطبيق مرتبطة بدور العميل حتى يعرض التطبيق التحديثات التشغيلية غير المقروءة دون الاعتماد على البريد أو الدفع.',
        unreadNotifications: '{count} إشعار غير مقروء',
        unreadNotifications_plural: '{count} إشعارات غير مقروءة',
        loadingInbox: 'جار تحميل الصندوق',
        emptyInbox: 'ستظهر إشعارات الطلب والدعم هنا بعد إضافتها للعميل المسجل.',
        activeOrder: 'الطلب النشط',
        activeOrderDescription:
          'تظل بطاقة الطلب الحي مطابقة للخط الزمني الملحق حتى يدخل مسار الاكتشاف الجديد إلى شاشة الطلب الحالية دون تغيير الدفع.',
        trackOrder: 'تتبع الطلب {code}',
        preparingOrder: 'تجهيز الطلب الحي',
        loadingOrder: 'جار تحميل حالة الطلب',
        lifecycleEvents: '{count} أحداث من دورة الطلب ظاهرة على الجهاز.',
        waitingOrder: 'بانتظار بيانات الطلب.',
        routes: 'المسارات',
        routesTitle: 'تابع مسار العميل',
        routesDescription:
          'يبقى الملف الشخصي والتسجيل والعناوين والسلة وتتبع الطلب كمسارات منفصلة مع نفس عميل الاستعلام والحزمة المشتركة.',
        promoBannerEyebrow: 'لفترة محدودة',
        promoBannerTitle: 'توصيل مجاني اليوم',
        promoBannerDescription: 'على الطلبات فوق 40 ر.س من أفضل المطاعم.',
        dailyOffersTitle: 'عروض اليوم',
        categoryPickerTitle: 'ماذا تحتاج؟',
        prototypeKicker: 'صباح الخير',
        prototypeTitle: 'ماذا ترغب اليوم؟',
        prototypeDescription: 'التوصيل إلى عناوينك المحفوظة',
        categoriesTitle: 'التصنيفات',
        nearbyRestaurantsTitle: 'مطاعم قريبة',
        topRatedTitle: 'الأعلى تقييماً',
        allNearbyTitle: 'كل القريب منك',
        newNotifications: '{count} جديد',
        optionCount: '{count} خيار',
        optionCount_plural: '{count} خيارات',
        defaultLabel: 'افتراضي',
        useLabel: 'استخدم',
        nearbyLabel: 'قريب منك',
        updatesEyebrow: 'التحديثات',
        updatesDescription: 'تظهر تحديثات الطلب وردود الدعم هنا أولاً.',
        moreEyebrow: 'المزيد',
        moreTitle: 'واصل الطلب',
        moreDescription:
          'الملف الشخصي والعناوين والإشعارات والسلة والتتبع المباشر.',
        addressLabels: {
          home: 'البيت',
          work: 'العمل',
          office: 'المكتب',
        },
        categories: {
          all: {
            label: 'الكل',
            meta: 'قريب منك',
            icon: 'apps',
          },
          restaurants: {
            label: 'مطاعم',
            meta: 'وجبات ومقاهي',
            icon: 'silverware-fork-knife',
          },
          market: {
            label: 'ماركت',
            meta: 'مشتريات يومية',
            icon: 'basket-outline',
          },
          pharmacy: {
            label: 'صيدلية',
            meta: 'احتياجات العناية',
            icon: 'medical-bag',
          },
          gifts: {
            label: 'ورود وهدايا',
            meta: 'نفس اليوم',
            icon: 'gift-outline',
          },
          pickup: {
            label: 'استلام',
            meta: 'الفرع جاهز',
            icon: 'shopping-outline',
          },
        },
        offers: {
          discountBadge: 'خصم 35%',
          discountTitle: 'خصومات اليوم',
          discountMeta: 'وجبات مختارة',
          freeBadge: '0 ر.س',
          freeTitle: 'توصيل مجاني',
          freeMeta: 'متاجر HPlus',
          quickBadge: '20 دقيقة',
          quickTitle: 'طلب سريع',
          quickMeta: 'سلال الماركت',
        },
      },
      merchant: {
        screenDescription:
          'تصفح الفروع القابلة للخدمة وقارن مدة الوصول ورسوم التوصيل ثم افتح قائمة الفرع الأنسب.',
        screenEyebrow: 'ملف المتجر',
        screenTitle: 'ملف المتجر',
        loadingTitle: 'جار تحميل تفاصيل المتجر',
        fallbackMerchant: 'متجر Talabix',
        openNow: 'مفتوح الآن',
        closedNow: 'مغلق الآن',
        discountBadge: 'خصم 30%',
        pageKicker: 'ملف المتجر',
        deliveryBadge: 'التوصيل 15-30 دقيقة',
        freeDeliveryBadge: 'خيارات توصيل مجاني',
        delivery: 'توصيل',
        pickup: 'استلام',
        deliverTo: 'التوصيل إلى',
        defaultAddress: '{label} افتراضي',
        summaryEyebrow: 'ملخص المتجر',
        summaryDescription: 'اختر فرعاً بمدة وصول ورسوم توصيل واضحة.',
        loadingSummary: 'جار تحميل الملخص',
        serviceableBranches: '{count} فرع قابل للخدمة',
        serviceableBranches_plural: '{count} فروع قابلة للخدمة',
        notServiceable: 'غير قابل للخدمة',
        chooseBranch: 'اختر الفرع',
        serviceableBranch: 'فرع قابل للخدمة',
        outOfRange: 'خارج النطاق',
        eta: '{minutes} دقيقة',
        etaVia: '{minutes} دقيقة عبر {provider}',
        deliveryFee: 'توصيل {amount}',
        distanceFromAddress: '{distance}م من العنوان المحدد.',
        selectAddressForServiceability: 'اختر عنواناً لمعرفة قابلية الخدمة.',
        menuTitle: 'القائمة',
        addedToCart: 'تمت إضافة {item} إلى السلة.',
        back: 'رجوع',
      },
      cart: {
        screenDescription:
          'راجع الكميات وعنوان التوصيل والملاحظات وإجماليات الدفع عند الاستلام قبل إنشاء الطلب.',
        screenEyebrow: 'الدفع',
        screenTitle: 'سلة Talabix',
        pageKicker: 'طلبك',
        pageTitle: 'السلة',
        checkoutNotesUpdated: 'تم تحديث ملاحظات الدفع.',
        promoApplied: 'تم تطبيق كود الخصم {code}.',
        promoInvalid: 'كود الخصم غير صالح لهذه السلة.',
        orderCreated: 'تم إنشاء الطلب {code}.',
        notReady: 'السلة غير جاهزة للدفع.',
        branchPrompt: 'اختر فرعاً من اكتشاف المتاجر لبدء السلة.',
        deliveryOrder: 'طلب توصيل',
        itemCount: '{count} عنصر في السلة',
        itemCount_plural: '{count} عناصر في السلة',
        loadingCart: 'جار تحميل السلة',
        items: 'العناصر',
        itemDescription: '{count} عنصر بسعر {amount} لكل واحد',
        itemDescription_plural: '{count} عناصر بسعر {amount} لكل واحد',
        cartItem: 'عنصر السلة',
        lineTotal: 'إجمالي السطر',
        removing: 'جار الحذف',
        removeOne: 'حذف واحد',
        qty: 'الكمية {count}',
        adding: 'جار الإضافة',
        addOne: 'إضافة واحد',
        emptyDescription: 'تصفح كتالوج الفرع لإضافة عناصر قبل الدفع.',
        emptyEyebrow: 'سلة فارغة',
        emptyTitle: 'السلة فارغة حالياً',
        deliveryContext: 'سياق التوصيل',
        deliveryContextDescription:
          'يستخدم الدفع العنوان الافتراضي الحالي من دفتر العناوين.',
        addDefaultAddress: 'أضف عنواناً افتراضياً أولاً',
        noAddress: 'لا يوجد عنوان متاح للدفع.',
        noBranch: 'لم يتم اختيار فرع',
        noStore: 'لم يتم اختيار متجر',
        cod: 'الدفع عند الاستلام',
        paymentSummary: 'ملخص الدفع',
        paymentSummaryDescription:
          'الدفع عند الاستلام فقط في الإصدار الأول مع تثبيت الأسعار ورسوم التوصيل في الطلب.',
        deliveryNotes: 'ملاحظات التوصيل',
        promoCode: 'كود الخصم',
        applying: 'جار التطبيق',
        applyPromo: 'تطبيق الخصم',
        subtotal: 'المجموع الفرعي',
        deliveryFee: 'رسوم التوصيل',
        offerSavings: 'توفير العروض',
        freeDelivery: 'توصيل مجاني',
        totalDiscounts: 'إجمالي الخصومات',
        total: 'الإجمالي',
        placingOrder: 'جار إنشاء الطلب',
        placeCodOrder: 'إنشاء طلب الدفع عند الاستلام',
        checkout: 'الدفع',
        back: 'رجوع',
      },
      tracking: {
        screenDescription:
          'تتصل تحديثات الطلب المباشرة بالخط الزمني الملحق وقنوات البث الخاصة بكل دور.',
        screenEyebrow: 'تتبع مباشر',
        screenTitle: 'تتبع طلب Talabix',
        englishScreenTitle: 'Talabix order tracking',
        englishExceptionEyebrow: 'Delivery issue reported',
        pageKicker: 'تتبع مباشر',
        pageTitle: 'تتبع طلبك',
        currentStatus: 'الحالة الحالية',
        promoDescription: 'الطلب {code}',
        promoLoadingCode: 'جار التحميل',
        summaryDescription:
          'يعرض التطبيق حالة مبسطة حتى يعرف العميل موقع الطلب دون قراءة الخط الزمني الخام.',
        summaryEyebrow: 'ملخص التتبع',
        loadingStatus: 'جار تحميل الحالة',
        orderTotal: 'إجمالي الطلب',
        lifecycleEvents: '{count} حدث ظاهر على الجهاز.',
        lifecycleEvents_plural: '{count} أحداث ظاهرة على الجهاز.',
        waitingEvents: 'بانتظار أحداث التتبع.',
        cod: 'الدفع عند الاستلام',
        exceptionDescription: 'يتابع الدعم مشكلة التوصيل.',
        exceptionEyebrow: 'تم الإبلاغ عن مشكلة توصيل',
        riderReported: 'أبلغ المندوب عن {reason}.',
        orderTimeline: 'خط سير الطلب',
        liveStatusUpdates: 'تحديثات الحالة المباشرة',
        completed: 'مكتمل',
        waiting: 'بانتظار',
        done: 'تم',
        next: 'التالي',
        stepNumber: 'الخطوة {number}',
        rawTimeline: 'الخط الزمني',
        timestampPending: 'الوقت قيد التحديث',
        timelineEvent: 'حدث زمني',
        waitingOrderData: 'بانتظار بيانات الطلب.',
        priceBreakdown: 'تفصيل السعر',
      },
      catalog: {
        screenDescription:
          'تصفح أقسام القائمة وعدل الإضافات مع إبقاء ملخص السلة ظاهراً قبل الدفع.',
        screenEyebrow: 'القائمة',
        screenTitle: 'قائمة الفرع',
        pageKicker: 'القائمة',
        pageTitle: 'قائمة الفرع',
        currentOffer: 'العرض الحالي',
        highlightedDescription: 'تم اختيار {item} من {offer}.',
        defaultDescription:
          'يتم تسعير الإضافات قبل الدفع حتى يبقى كل سطر في السلة واضحاً.',
        offerSelected: 'عرض محدد',
        fastAdd: 'إضافة سريعة',
        highlightedTitle: 'أضف عنصر العرض إلى السلة',
        defaultTitle: 'اختر مفضلاتك وعدل الإضافات ثم تابع إلى السلة',
        categories: 'التصنيفات',
        allItems: 'كل العناصر',
        itemInSection: '{count} عنصر في هذا القسم.',
        itemInSection_plural: '{count} عناصر في هذا القسم.',
        selectedOfferItem: 'عنصر العرض المحدد',
        catalogItem: 'عنصر الكتالوج',
        offer: 'عرض',
        discountBadge: 'خصم 30%',
        itemPrice: 'سعر العنصر',
        modifierSelectionCount: '{count} اختيار إضافة نشط',
        modifierSelectionCount_plural: '{count} اختيارات إضافات نشطة',
        offerItem: 'عنصر عرض',
        pickOne: 'اختر واحداً',
        pickUpTo: 'اختر حتى {count}',
        pickUpToMany: 'اختر حتى عدة خيارات',
        addToCart: 'إضافة إلى السلة',
        noItemsDescription: 'لا يحتوي هذا الفرع على عناصر تجريبية بعد.',
        noItemsEyebrow: 'لا توجد عناصر',
        noItemsTitle: 'معاينة الكتالوج غير متاحة',
        cartDescription: 'تبقى اختيارات الإضافات مرتبطة بكل سطر في السلة.',
        cartEyebrow: 'السلة الحالية',
        cartItemCount: '{count} عنصر في السلة',
        cartItemCount_plural: '{count} عناصر في السلة',
        subtotal: 'المجموع الفرعي',
        delivery: 'التوصيل',
        offerDiscounts: 'خصومات العروض',
        total: 'الإجمالي',
        openCart: 'فتح السلة',
      },
      notifications: {
        screenDescription:
          'يعتمد صندوق العميل على سجلات داخل التطبيق فقط، لذلك تبقى حالة القراءة منفصلة عن البريد أو التنبيهات.',
        screenEyebrow: 'صندوق العميل',
        screenTitle: 'يبقى سجل الإشعارات مرتبطاً بتحديثات الطلب الفعلية.',
        pageKicker: 'صندوق العميل',
        pageTitle: 'يبقى سجل الإشعارات مرتبطاً بتحديثات الطلب الفعلية.',
        updateFailed: 'تعذر تحديث الإشعار.',
        markedRead: 'تم تعليم {title} كمقروء.',
        unreadFilterDescription:
          'فلتر غير المقروء خاص بالعميل الحالي ويعرض إشعارات التطبيق فقط.',
        inboxState: 'حالة الصندوق',
        unreadSummary: '{unread} غير مقروء من {total}',
        loading: 'جار تحميل الإشعارات',
        unreadOnlyOn: 'غير المقروء فقط: مفعل',
        unreadOnlyOff: 'غير المقروء فقط: غير مفعل',
        readEyebrow: 'مقروء',
        unreadEyebrow: 'غير مقروء',
        general: 'عام',
        read: 'مقروء',
        unread: 'غير مقروء',
        queuedAt: 'أضيف {time}',
        queuedUnavailable: 'وقت الإضافة غير متاح.',
        marking: 'جار التعليم...',
        markRead: 'تعليم كمقروء',
        emptyDescription:
          'قد يخفي فلتر غير المقروء الإشعارات التي تم الاطلاع عليها.',
        emptyEyebrow: 'الصندوق فارغ',
        emptyTitle: 'لا توجد إشعارات تطابق الفلتر الحالي.',
        emptyBody:
          'تعتمد حالة صندوق العميل على نفس سجلات الإشعارات المرتبطة بالطلبات في الخلفية.',
      },
      offers: {
        screenDescription:
          'تصفح عروض العملاء من واجهة العروض مع صور محلية وبيانات عناصر مرتبطة بالفروع.',
        screenEyebrow: 'العروض',
        screenTitle: 'عروض قريبة منك',
        pageKicker: 'العروض',
        pageTitle: 'عروض قريبة منك',
        limitedTime: 'لفترة محدودة',
        promoDescription:
          'مطاعم وماركت وباقات أعضاء محدثة مباشرة من قائمة العروض.',
        promoEyebrow: 'اليوم',
        promoTitle: 'عروض جاهزة لطلبك القادم',
        apiDescription:
          'بطاقات العروض تعرض المتجر والفرع والمنتج بدل اختصار ثابت للكتالوج.',
        apiEyebrow: 'واجهة العروض',
        activeOfferCount: '{count} عرض نشط',
        activeOfferCount_plural: '{count} عروض نشطة',
        packagedArtwork: 'صور جاهزة',
        branchAware: 'حسب الفرع',
        availableOffers: 'العروض المتاحة',
        minimumSpend: 'الحد الأدنى',
        deliveryFee: 'رسوم التوصيل',
        expires: 'ينتهي {date}',
        code: 'الكود {code}',
        viewOffer: 'عرض العرض',
        empty: 'لا توجد عروض عملاء نشطة الآن.',
        offerCopy: {
          'free-delivery-shawarma': {
            title: 'توصيل مجاني',
            description:
              'لا توجد رسوم توصيل على لفائف مختارة من فرع العليا وقت العشاء.',
            discountLabel: 'توصيل 0 ر.س',
            itemName: 'شاورما دجاج',
            branchName: 'فرع العليا',
          },
          'market-basket-save': {
            title: 'وفر على سلال الماركت',
            description:
              'اجمع أساسيات البيت من طلبكس ماركت واحصل على خصم فوري.',
            discountLabel: 'خصم 20%',
            itemName: 'سلة ماركت طازجة',
            branchName: 'فرع الماركت السريع',
          },
          'morning-coffee-pack': {
            title: 'عرض عبوة القهوة',
            description: 'أضف قهوة باردة إلى طلب الإفطار أو الماركت بسعر مميز.',
            discountLabel: 'خصم 8 ر.س',
            itemName: 'عبوة قهوة باردة',
            branchName: 'فرع الماركت السريع',
          },
        },
      },
      orders: {
        screenDescription:
          'راجع مشترياتك النشطة والسابقة من واجهة سجل طلبات العميل.',
        screenEyebrow: 'الطلبات',
        screenTitle: 'سجل الطلبات',
        pageKicker: 'الطلبات',
        pageTitle: 'سجل الطلبات',
        datePending: 'التاريخ قيد التحديث',
        itemCount: '{count} عنصر',
        itemCount_plural: '{count} عناصر',
        searchPlaceholder: 'ابحث في الطلبات أو المتجر',
        activeOrderDescription: 'الطلب {code} حالته {status}.',
        noActiveDescription: 'مشترياتك السابقة جاهزة لإعادة الطلب بسرعة.',
        latestOrder: 'آخر طلب',
        noActiveDelivery: 'لا يوجد توصيل نشط',
        historyDescription:
          'الطلبات الحالية والسابقة جاهزة للتتبع أو إعادة الطلب.',
        historyEyebrow: 'سجل الطلبات',
        recentOrders: '{count} طلب حديث',
        recentOrders_plural: '{count} طلبات حديثة',
        activeAndPast: 'طلبات نشطة وسابقة',
        reorderReady: 'جاهزة لإعادة الطلب',
        orders: 'الطلبات',
        tracking: 'قيد التتبع',
        pastOrder: 'طلب سابق',
        orderCode: 'طلب {code}',
        reordering: 'جاري إعادة الطلب...',
        trackOrder: 'تتبع الطلب',
        reorder: 'إعادة الطلب',
        empty: 'لا يوجد سجل طلبات لهذا العميل بعد.',
        branchNames: {
          'Olaya Branch': 'فرع العليا',
        },
      },
      points: {
        screenDescription:
          'تتبع مكافآت HPlus وتقدم التوصيل المجاني ومزايا القسائم في وجهة واحدة.',
        screenEyebrow: 'مكافآت HPlus',
        screenTitle: '9000 نقطة',
        pageKicker: 'مكافآت HPlus',
        pageTitle: '9000 نقطة',
        promoDescription:
          'أنفق 30 ر.س لدى المتاجر المؤهلة لفتح مكافأة التوصيل المجاني التالية.',
        previewDescription:
          'تعكس هذه الشاشة واجهة الولاء المرجعية حتى تتوفر واجهة سجل المكافآت.',
        freeDeliveryProgress: 'تقدم التوصيل المجاني',
        addMore: 'أضف 15 ر.س أخرى',
        currentSpend: 'الإنفاق الحالي',
        rewardThreshold: 'حد المكافأة',
        autoApply: 'تطبيق تلقائي',
        vouchersDescription:
          'تعتمد القسائم والنقاط هنا على بيانات معاينة محلية حتى تكتمل واجهة المكافآت.',
        vouchers: 'القسائم',
        rewardsSoon: 'مكافأتان جاهزتان قريباً',
        voucherBody:
          'سيظهر التوصيل المجاني وخصومات العناصر المختارة ومزايا الأعضاء في هذه الشاشة.',
      },
      profile: {
        screenDescription:
          'يبقى تعديل ملف العميل صغيراً في هذه المرحلة: الاسم والهاتف قابلان للتعديل بنفس شكل الحمولة في الخلفية.',
        screenEyebrow: 'ملف العميل',
        screenTitle: 'تحديث أساسيات الملف',
        saved: 'تم حفظ ملف {name}.',
        reviewDetails: 'راجع تفاصيل الملف الشخصي.',
        waitingCustomer: 'بانتظار بيانات العميل الحالي.',
        account: 'الحساب',
        loadingProfile: 'جار تحميل الملف',
        walletHPlus: 'بلس',
        walletPay: 'دفع',
        walletRewards: 'مكافآت',
        walletVouchers: 'قسائم',
        accountDescription: 'إدارة العناوين والتنبيهات والفواتير والمساعدة.',
        currentAccount: 'الحساب الحالي',
        signedInAccount: 'حساب مسجل',
        roles: 'الأدوار: {roles}',
        myProfile: 'ملفي الشخصي',
        active: 'نشط',
        favorites: 'المفضلة',
        invoices: 'الفواتير',
        notifications: 'الإشعارات',
        settings: 'الإعدادات',
        help: 'المساعدة والدعم',
        formDescription: 'حافظ على بيانات التواصل جاهزة لتحديثات التوصيل.',
        profileForm: 'نموذج الملف',
        editNamePhone: 'تعديل الاسم والهاتف',
        fullName: 'الاسم الكامل',
        phone: 'رقم الهاتف',
        saving: 'جار حفظ الملف',
        save: 'حفظ الملف',
      },
      registration: {
        screenDescription:
          'ينشئ تسجيل العميل نفس غلاف الرمز والمستخدم حتى ينتقل التطبيق مباشرة إلى الاكتشاف وتعديل الملف.',
        screenEyebrow: 'تسجيل العميل',
        screenTitle: 'إنشاء جلسة عميل أو استبدالها',
        pageKicker: 'تسجيل العميل',
        pageTitle: 'إنشاء جلسة عميل أو استبدالها',
        registered: 'تم تسجيل {email}.',
        reviewDetails: 'راجع تفاصيل التسجيل.',
        sessionDescription:
          'يتحقق نموذج الجوال من نفس مخطط التسجيل الموجود في الحزمة المشتركة.',
        currentSession: 'الجلسة الحالية',
        noCustomerLoaded: 'لا يوجد عميل محمل',
        sessionLoading: 'جار تحميل جلسة العميل.',
        issuedToken: 'الرمز الصادر',
        formDescription:
          'يبقى البريد وكلمة المرور طريقة الدخول الوحيدة حالياً، ويضاف دور العميل تلقائياً بعد التسجيل.',
        registrationForm: 'نموذج التسجيل',
        registerCredentials: 'تسجيل بيانات العميل',
        fullName: 'الاسم الكامل',
        email: 'البريد الإلكتروني',
        phone: 'رقم الهاتف',
        deviceName: 'اسم الجهاز',
        password: 'كلمة المرور',
        confirmPassword: 'تأكيد كلمة المرور',
        createAccount: 'إنشاء حساب العميل',
        resetForm: 'إعادة ضبط النموذج',
      },
      addressBook: {
        screenDescription:
          'تلتقط العناوين الآن تفاصيل توصيل أغنى وتبقي عنواناً افتراضياً واحداً وتدعم بحث الأماكن قبل التعديل اليدوي.',
        screenEyebrow: 'دفتر العناوين',
        screenTitle: 'نقاط تسليم محفوظة بتفاصيل أغنى',
        chooseAddress: 'اختر عنوان التوصيل',
        deliveryAddress: 'عنوان التوصيل',
        selectedAddress: 'العنوان المحدد',
        savedAddress: 'عنوان محفوظ',
        selected: 'محدد',
        use: 'استخدم',
        addressUpdated: 'تم تحديث العنوان.',
        addressCreated: 'تم إنشاء العنوان.',
        reviewFields: 'راجع حقول العنوان.',
        defaultUpdated: 'تم تحديث العنوان الافتراضي.',
        suggestionApplied: 'تم تطبيق {title} من بحث الخرائط.',
        placePickerDescription:
          'ابحث عن مكان، أضف ملاحظات التوصيل، ثم احفظه في دفتر العناوين.',
        placePicker: 'اختيار الموقع',
        updateSavedAddress: 'تحديث عنوان محفوظ',
        pickPlaceTitle: 'اختر مكاناً ثم احفظ العنوان',
        searchPlaces: 'بحث الأماكن',
        usePlace: 'استخدم {label}',
        noSuggestions:
          'لا توجد اقتراحات خرائط تطابق البحث الحالي. يمكنك إدخال العنوان والإحداثيات يدوياً.',
        label: 'التسمية',
        addressLine1: 'سطر العنوان 1',
        addressLine2: 'سطر العنوان 2',
        building: 'المبنى',
        floorLabel: 'الدور',
        apartmentLabel: 'الشقة',
        landmarkLabel: 'علامة قريبة',
        deliveryNotes: 'ملاحظات التوصيل',
        city: 'المدينة',
        latitude: 'خط العرض',
        longitude: 'خط الطول',
        defaultOn: 'افتراضي مفعل',
        markDefault: 'تعيين كافتراضي',
        saving: 'جار حفظ العنوان',
        saveChanges: 'حفظ تغييرات العنوان',
        createSaved: 'إنشاء عنوان محفوظ',
        cancelEdit: 'إلغاء التعديل',
        defaultAddress: 'العنوان الافتراضي',
        floor: 'الدور {floor}',
        unit: 'الوحدة {apartment}',
        landmark: 'علامة قريبة: {landmark}',
        noLandmark: 'لا توجد علامة قريبة محفوظة بعد.',
        notes: 'ملاحظات: {notes}',
        noNotes: 'لا توجد ملاحظات توصيل محفوظة.',
        edit: 'تعديل',
        makingDefault: 'جار التعيين',
        makeDefault: 'اجعله افتراضياً',
        useCurrentLocation: 'استخدم الموقع الحالي',
        findingCurrentLocation: 'جار تحديد الموقع الحالي',
        locationHelp:
          'استخدم GPS الحالي لتعبئة خط العرض وخط الطول فقط. يمكنك تعديل كل حقول العنوان قبل الحفظ.',
        locationApplied:
          'تمت إضافة إحداثيات GPS الحالية. راجع تفاصيل العنوان قبل الحفظ.',
        locationPermissionDenied:
          'إذن الموقع متوقف. فعّله من إعدادات النظام أو أدخل الإحداثيات يدوياً.',
        locationUnavailable:
          'الموقع الحالي غير متاح الآن. أدخل الإحداثيات يدوياً أو حاول مرة أخرى.',
      },
    },
    rider: {
      home: {
        eyebrow: 'تطبيق المندوب',
        title: 'مسار تسليم مبسط لطلب نشط واحد في كل مرة.',
        description:
          'تتحرك الإتاحة واستلام المهمة وتأكيد الاستلام وإثبات التسليم عبر مسار خاص بالمندوب يطابق دورة العمل في الخلفية.',
        activeAssignment: 'المهمة النشطة',
        waitingDispatch: 'بانتظار الإسناد',
        activeStops: '{count} توقف نشط',
        activeStops_plural: '{count} توقفات نشطة',
        customerDropoff: 'العميل {customer} - التسليم {dropoff}',
        waitingDispatchData: 'بانتظار بيانات الإسناد.',
        nextAction: 'التالي: {action}',
        inbox: 'الصندوق',
        inboxDescription:
          'تظهر تحديثات الإسناد والدعم الآن في صندوق المندوب داخل التطبيق، منفصلة عن حالة إشعارات الدفع.',
        unreadNotifications: '{count} إشعار غير مقروء',
        unreadNotifications_plural: '{count} إشعارات غير مقروءة',
        loadingInbox: 'جار تحميل صندوق المندوب',
        emptyInbox: 'ستظهر إشعارات الإسناد والدعم هنا لجلسة المندوب النشطة.',
        availability: 'الإتاحة',
        availabilityDescription:
          'تعكس شاشة المندوب افتراضات الإسناد في الخلفية: لا تجميع، لا تحسين مسارات، ولا طلبات مكدسة في الإصدار الأول.',
        availabilityHelp:
          'بدّل حالة الاتصال، ثم اقبل واستلم وسلّم والتقط الإثبات.',
        goAvailable: 'اجعلني متاحاً',
        goOffline: 'إيقاف الاتصال',
        updatingAvailability: 'جار تحديث الإتاحة',
        availabilityUpdateFailed: 'تعذر تحديث الإتاحة.',
        availabilityUpdated: 'تم تحديث الإتاحة إلى {availability}.',
        nextSteps: 'الخطوات التالية',
        riderActions: 'إجراءات المندوب',
        nextStepsDescription:
          'تبقى ملفات المسارات في Expo Router، بينما تبقى الشاشات قابلة للاختبار كمكونات React Native عادية بحالة مهمة واحدة قابلة للتعديل.',
      },
    },
    ops: {
      dashboard: {
        eyebrow: 'مؤشرات السوق',
        title: 'عرض الأداء عبر الطلبات والمالية وأرباح المندوبين',
        activeOrders: '{count} طلب نشط',
        rangeLabel: 'اختيار نطاق لوحة العمليات',
        last7Days: 'آخر ٧ أيام',
        last30Days: 'آخر ٣٠ يوماً',
        grossSales: 'إجمالي المبيعات',
        grossSalesDescription:
          'إجمالي الطلبات غير الملغاة ضمن نافذة التقرير المحددة.',
        platformNet: 'صافي المنصة',
        platformNetDescription:
          'العمولة مع التسويات، مفصولة عن التزامات التجار والمندوبين.',
        riderEarnings: 'أرباح المندوبين',
        riderEarningsDescription:
          'إجمالي التزام مدفوعات المندوبين الناتج عن الطلبات المسلمة ضمن النطاق.',
        kpiSummary: 'ملخص المؤشرات',
        orderFleetHealth: 'صحة الطلبات والأسطول',
        totalOrders: 'إجمالي الطلبات',
        delivered: 'المسلمة',
        cancelled: 'الملغاة',
        activeMerchants: 'التجار النشطون',
        acceptingBranches: 'الفروع المستقبلة',
        availableRiders: 'المندوبون المتاحون',
        statusBreakdown: 'توزيع الحالات',
        orderStateMix: 'مزيج حالات الطلب',
        status: 'الحالة',
        count: 'العدد',
        merchantSales: 'مبيعات التجار',
        merchantRanking: 'ترتيب التجار',
        merchant: 'التاجر',
        orders: 'الطلبات',
        payoutExposure: 'التزامات الدفع',
        rider: 'المندوب',
        deliveries: 'التسليمات',
        earnings: 'الأرباح',
        averageDelivery: 'المتوسط / تسليم',
        dailyTrend: 'الاتجاه اليومي',
        orderVolumeByDay: 'حجم الطلبات حسب اليوم',
        date: 'التاريخ',
        loadingTitle: 'جار تحميل اللوحة',
        loadingDescription:
          'يجمع العرض الطلبات وصفوف السجل وإتاحة المندوبين في استجابة واحدة.',
      },
      accountSecurity: {
        eyebrow: 'أمان الحساب',
        title: 'تغيير كلمة مرور العمليات',
        security: 'أمان',
        passwordForm: 'كلمة المرور',
        passwordFormTitle: 'تحديث بيانات الدخول',
        description:
          'استخدم كلمة المرور الحالية لتعيين كلمة مرور جديدة للبوابة. يتم تسجيل خروج الجلسات الأخرى بعد التغيير.',
        currentPassword: 'كلمة المرور الحالية',
        newPassword: 'كلمة المرور الجديدة',
        confirmPassword: 'تأكيد كلمة المرور الجديدة',
        updatePassword: 'تحديث كلمة المرور',
        updatingPassword: 'جار تحديث كلمة المرور',
        success: 'تم تحديث كلمة المرور بنجاح.',
        mismatch: 'يجب أن تتطابق كلمة المرور الجديدة مع التأكيد.',
        review: 'راجع حقول كلمة المرور وحاول مرة أخرى.',
        sessionOwner: 'الحساب المسجل',
        signedInAs: 'مسجل الدخول باسم {email}.',
        noStoredUser: 'جلسة تجريبية بدون حساب مباشر محفوظ.',
        passwordPolicy: 'سياسة كلمة المرور',
        passwordPolicyTitle: 'استخدم ٨ أحرف على الأقل',
        passwordPolicyCopy:
          'اختر كلمة مرور غير مستخدمة للاستضافة أو البريد أو وصول SSH.',
        otherSessions:
          'بعد التحديث يتم إلغاء رموز البوابة الأخرى الخاصة بهذا الحساب.',
      },
      userManagement: {
        eyebrow: 'إدارة مستخدمي العمليات',
        title: 'دعوة وتعطيل مستخدمي العمليات',
        totalUsers: '{count} مستخدم',
        inviteEyebrow: 'دعوة',
        inviteTitle: 'إنشاء دخول للعمليات',
        inviteDescription:
          'يمكن للمدير الأعلى إنشاء مستخدم عمليات بصلاحية محددة وكلمة مرور مؤقتة ثم تعطيله أو إعادة تفعيله دون SSH.',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phoneOptional: 'رقم الهاتف',
        role: 'الدور',
        status: 'الحالة',
        temporaryPassword: 'كلمة مرور مؤقتة',
        confirmTemporaryPassword: 'تأكيد كلمة المرور المؤقتة',
        inviteUser: 'دعوة مستخدم عمليات',
        inviting: 'جار دعوة المستخدم',
        inviteSuccess: 'تمت دعوة {name}.',
        inviteFailed: 'تعذرت دعوة مستخدم العمليات.',
        directoryEyebrow: 'الدليل',
        directoryTitle: 'وصول البوابة المحدد',
        directoryDescription:
          'لا يمكن الدخول إلى البوابة إلا لمستخدمي العمليات النشطين الذين لديهم دور عمليات. المستخدمون المعطلون تفقد رموزهم صلاحيتها.',
        currentAdmin: 'المدير الحالي',
        currentAdminDescription: 'تدير المستخدمين باسم {email}.',
        demoAdminDescription: 'يحفظ الوضع التجريبي التغييرات داخل المتصفح.',
        userDirectory: 'دليل المستخدمين',
        userDirectoryTitle: 'مستخدمو العمليات',
        loadingTitle: 'جار تحميل مستخدمي العمليات',
        loadingDescription: 'جار جلب الأدوار وحالة الحساب الحالية.',
        noUsersTitle: 'لا يوجد مستخدمو عمليات',
        noUsersDescription: 'ادع أول مستخدم عمليات لبدء الدليل.',
        saveUser: 'حفظ المستخدم',
        saving: 'جار الحفظ',
        disableUser: 'تعطيل المستخدم',
        reactivateUser: 'إعادة تفعيل المستخدم',
        currentUser: 'أنت',
        updateSuccess: 'تم تحديث {name}.',
        updateFailed: 'تعذر تحديث مستخدم العمليات.',
        createdAt: 'تاريخ الإنشاء',
        lastLogin: 'آخر دخول',
        never: 'أبداً',
        roles: {
          opsAdmin: 'مدير أعلى',
          opsDispatcher: 'مشرف الإسناد',
          opsSupport: 'الدعم',
        },
        statuses: {
          active: 'نشط',
          suspended: 'معطل',
          pending: 'قيد الانتظار',
        },
      },
    },
    orders: {
      orderCode: 'طلب {code}',
    },
    enums: {
      orderStatus: {
        placed: 'تم الإنشاء',
        accepted: 'مقبول',
        preparing: 'قيد التحضير',
        ready_for_pickup: 'جاهز للاستلام',
        assigned: 'تم الإسناد',
        picked_up: 'تم الاستلام',
        delivered: 'تم التسليم',
        cancelled: 'ملغى',
      },
      orderTimelineEventType: {
        order_placed: 'تم إنشاء الطلب',
        merchant_accepted: 'قبله التاجر',
        merchant_rejected: 'رفضه التاجر',
        dispatch_started: 'بدأ الإسناد',
        rider_assigned: 'تم إسناد المندوب',
        rider_reassigned: 'تمت إعادة الإسناد',
        picked_up: 'تم الاستلام',
        delivery_exception_reported: 'تم تسجيل مشكلة توصيل',
        delivered: 'تم التسليم',
        cancelled: 'تم الإلغاء',
        support_note_added: 'أضيفت ملاحظة دعم',
      },
      paymentStatus: {
        pending_cod: 'الدفع عند الاستلام معلق',
        collected_cod: 'تم تحصيل الدفع عند الاستلام',
        waived: 'معفى',
      },
      riderAvailability: {
        offline: 'غير متصل',
        available: 'متاح',
        busy: 'مشغول',
        paused: 'متوقف مؤقتاً',
      },
      proofType: {
        recipient_confirmation: 'تأكيد المستلم',
        photo: 'صورة',
        handoff_code: 'رمز التسليم',
      },
      deliveryExceptionReason: {
        customer_unreachable: 'تعذر الوصول للعميل',
        address_issue: 'مشكلة في العنوان',
        merchant_delay: 'تأخير من التاجر',
        vehicle_issue: 'مشكلة في المركبة',
        safety_issue: 'مشكلة سلامة',
        other: 'أخرى',
      },
      notificationType: {
        order_status_updated: 'تحديث حالة الطلب',
        support_note_added: 'إضافة ملاحظة دعم',
      },
      notificationDeliveryStatus: {
        queued: 'قيد الانتظار',
        sent: 'تم الإرسال',
        failed: 'فشل',
      },
      notificationChannel: {
        in_app: 'داخل التطبيق',
        email: 'البريد الإلكتروني',
        push: 'تنبيه فوري',
        sms: 'رسالة نصية',
      },
      supportCaseStatus: {
        open: 'مفتوحة',
        investigating: 'قيد المتابعة',
        resolved: 'محلولة',
      },
      supportIssueType: {
        customer_request: 'طلب من العميل',
        delivery_delay: 'تأخير في التوصيل',
        address_issue: 'مشكلة في العنوان',
        merchant_issue: 'مشكلة لدى التاجر',
        rider_issue: 'مشكلة لدى المندوب',
        order_accuracy: 'دقة الطلب',
        payment_issue: 'مشكلة دفع',
        other: 'أخرى',
      },
      supportResolutionType: {
        customer_contacted: 'تم التواصل مع العميل',
        merchant_contacted: 'تم التواصل مع التاجر',
        rider_contacted: 'تم التواصل مع المندوب',
        clarified_instructions: 'تم توضيح التعليمات',
        cancelled_order: 'تم إلغاء الطلب',
        compensation_offered: 'تم عرض تعويض',
        monitoring_only: 'متابعة فقط',
        other: 'أخرى',
      },
      supportCancellationReasonCode: {
        customer_request: 'طلب من العميل',
        merchant_unavailable: 'التاجر غير متاح',
        out_of_stock: 'غير متوفر',
        address_unserviceable: 'العنوان خارج الخدمة',
        rider_issue: 'مشكلة لدى المندوب',
        duplicate_order: 'طلب مكرر',
        fraud_review: 'مراجعة احتيال',
        ops_override: 'تجاوز من العمليات',
        other: 'أخرى',
      },
      actorRole: {
        customer: 'عميل',
        merchant: 'تاجر',
        merchant_manager: 'مدير المتجر',
        rider: 'مندوب',
        ops_support: 'دعم العمليات',
        system: 'النظام',
      },
      ledgerEntryType: {
        merchant_receivable: 'مستحقات التاجر',
        platform_commission: 'عمولة المنصة',
        rider_earning: 'دخل المندوب',
        adjustment: 'تسوية يدوية',
      },
      auditActionType: {
        order_cancelled: 'إلغاء طلب',
        rider_reassigned: 'إعادة إسناد مندوب',
        branch_updated: 'تحديث فرع',
        catalog_updated: 'تحديث كتالوج',
        settlement_adjusted: 'تعديل تسوية',
        permission_changed: 'تغيير صلاحية',
        support_case_updated: 'تحديث حالة دعم',
        support_note_added: 'إضافة ملاحظة دعم',
        maps_configuration_updated: 'تحديث إعدادات الخرائط',
      },
    },
  },
};

export function normalizeLocale(locale) {
  if (!locale || typeof locale !== 'string') {
    return fallbackLocale;
  }

  const normalized = locale.trim().toLowerCase().replace('_', '-');
  const base = normalized.split('-')[0];

  return supportedLocales.includes(base) ? base : fallbackLocale;
}

export function getLocaleMetadata(locale) {
  return localeMetadata[normalizeLocale(locale)];
}

export function getDirection(locale) {
  return getLocaleMetadata(locale).dir;
}

export function isRtl(locale) {
  return getDirection(locale) === 'rtl';
}

export function getIntlLocale(locale) {
  return getLocaleMetadata(locale).intlLocale;
}

export function getTranslation(locale, key) {
  const normalizedLocale = normalizeLocale(locale);
  const value = lookup(translations[normalizedLocale], key);

  if (value !== undefined) {
    return value;
  }

  return lookup(translations[fallbackLocale], key);
}

export function t(key, params = {}, locale = fallbackLocale) {
  const template = getTranslation(locale, key);

  if (template === undefined) {
    return key;
  }

  return interpolate(String(template), params);
}

export function createTranslator(locale = fallbackLocale) {
  const normalizedLocale = normalizeLocale(locale);
  const translate = (key, params = {}) => t(key, params, normalizedLocale);

  translate.t = translate;
  translate.locale = normalizedLocale;
  translate.dir = getDirection(normalizedLocale);

  return translate;
}

export function labelForEnum(group, value, locale = fallbackLocale) {
  const key = `enums.${group}.${value}`;
  const template = getTranslation(locale, key);

  return template === undefined ? humanize(value) : t(key, {}, locale);
}

export function formatNumber(value, locale = fallbackLocale, options = {}) {
  return new Intl.NumberFormat(getIntlLocale(locale), options).format(value);
}

export function formatPercentage(value, locale = fallbackLocale, options = {}) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'percent',
    maximumFractionDigits: 1,
    ...options,
  }).format(value);
}

export function formatCurrency(
  amountMinor,
  currency = 'SAR',
  locale = fallbackLocale,
  options = {}
) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency,
    ...options,
  }).format((amountMinor ?? 0) / 100);
}

export function formatDate(value, locale = fallbackLocale, options = {}) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(toDate(value));
}

export function formatTime(value, locale = fallbackLocale, options = {}) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(toDate(value));
}

export function formatDateTime(value, locale = fallbackLocale, options = {}) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(toDate(value));
}

export function formatRelativeMinutes(minutes, locale = fallbackLocale) {
  return new Intl.RelativeTimeFormat(getIntlLocale(locale), {
    numeric: 'auto',
  }).format(minutes, 'minute');
}

export function logicalTextAlign(locale) {
  return isRtl(locale) ? 'right' : 'left';
}

export function logicalFlexDirection(locale) {
  return isRtl(locale) ? 'row-reverse' : 'row';
}

export function pluralKey(baseKey, count) {
  return count === 1 ? baseKey : `${baseKey}_plural`;
}

export function tp(baseKey, count, params = {}, locale = fallbackLocale) {
  const key = pluralKey(baseKey, count);
  const resolved = getTranslation(locale, key) === undefined ? baseKey : key;

  return t(resolved, { count, ...params }, locale);
}

function lookup(source, key) {
  return key.split('.').reduce((current, part) => {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) {
      return current[part];
    }

    return undefined;
  }, source);
}

function interpolate(template, params) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
    const value = params[name];

    return value === undefined || value === null ? match : String(value);
  });
}

function humanize(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toDate(value) {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
}
