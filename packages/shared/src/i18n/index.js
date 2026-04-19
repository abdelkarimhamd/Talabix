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
      },
    },
    portal: {
      brandMark: 'T',
      deliveryControl: 'Delivery control',
      title: 'Talabix portal',
      summary:
        'One React shell, split by actor routes and permissions so merchant staff and ops teams share infrastructure without sharing scope.',
      activeSession: 'Active session',
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
        searchPlaceholder: 'Search by merchant name',
        openNowOn: 'Open now only: on',
        openNowOff: 'Open now only: off',
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
        promoBannerEyebrow: 'Talabix Now',
        promoBannerTitle: 'Your delivery starts here',
        promoBannerDescription:
          'Meals, groceries, pharmacy basics, and gifts from one address-aware feed.',
        dailyOffersTitle: 'Daily offers',
        categoryPickerTitle: 'What do you need?',
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
      notificationType: {
        order_status_updated: 'Order status updated',
        support_note_added: 'Support note added',
      },
      notificationDeliveryStatus: {
        queued: 'Queued',
        sent: 'Sent',
        failed: 'Failed',
      },
      supportCaseStatus: {
        open: 'Open',
        investigating: 'Investigating',
        resolved: 'Resolved',
      },
      actorRole: {
        customer: 'Customer',
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
      },
    },
    portal: {
      brandMark: 'ت',
      deliveryControl: 'تحكم التوصيل',
      title: 'بوابة طلبكس',
      summary:
        'واجهة React واحدة مقسمة حسب مسارات الأدوار والصلاحيات حتى يعمل فريق التاجر وفريق العمليات على نفس البنية دون خلط نطاقات الوصول.',
      activeSession: 'الجلسة النشطة',
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
        searchPlaceholder: 'ابحث باسم المتجر',
        openNowOn: 'المفتوح الآن فقط: مفعل',
        openNowOff: 'المفتوح الآن فقط: غير مفعل',
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
        promoBannerEyebrow: 'طلبكس الآن',
        promoBannerTitle: 'توصيلك يبدأ من هنا',
        promoBannerDescription:
          'وجبات والبقالة وأساسيات الصيدلية والهدايا من خلاصة واحدة تراعي عنوانك.',
        dailyOffersTitle: 'عروض اليوم',
        categoryPickerTitle: 'ماذا تحتاج؟',
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
      notificationType: {
        order_status_updated: 'تحديث حالة الطلب',
        support_note_added: 'إضافة ملاحظة دعم',
      },
      notificationDeliveryStatus: {
        queued: 'قيد الانتظار',
        sent: 'تم الإرسال',
        failed: 'فشل',
      },
      supportCaseStatus: {
        open: 'مفتوحة',
        investigating: 'قيد المتابعة',
        resolved: 'محلولة',
      },
      actorRole: {
        customer: 'عميل',
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
