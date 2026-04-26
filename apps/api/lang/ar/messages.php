<?php

return [
    'auth' => [
        'missing_ability' => 'صلاحية الرمز المطلوبة غير متوفرة: :ability.',
    ],
    'validation' => [
        'failed' => 'يرجى مراجعة الحقول المطلوبة.',
    ],
    'mail' => [
        'order_label' => 'الطلب:',
    ],
    'maps' => [
        'distance_meters' => ':meters م',
        'distance_kilometers' => ':kilometers كم',
        'duration_minutes' => '{1} :minutes دقيقة|[2,*] :minutes دقائق',
    ],
    'dispatch' => [
        'fallbacks' => [
            'unassigned_rider' => 'مندوب غير محدد',
            'unknown_rider' => 'مندوب غير معروف',
        ],
        'locations' => [
            'rider_live_position' => 'موقع المندوب الحالي',
            'rider_location_unavailable' => 'موقع المندوب غير متاح',
        ],
        'reassignment' => [
            'terminal_order' => 'لا يمكن إعادة إسناد الطلبات المسلّمة أو الملغاة.',
            'same_rider' => 'اختر مندوباً مختلفاً لإعادة الإسناد.',
            'unavailable_rider' => 'المندوب المحدد غير متاح لإعادة الإسناد.',
            'ineligible_rider' => 'المندوب المحدد غير مؤهل لهذا الطلب.',
        ],
        'sla' => [
            'on_track' => 'ضمن الوقت',
            'warning' => 'اتفاقية الخدمة معرضة للخطر',
            'breached' => 'تم تجاوز اتفاقية الخدمة',
        ],
        'exception_sla' => [
            'on_track' => 'استجابة مشكلة التوصيل ضمن الوقت',
            'warning' => 'استجابة مشكلة التوصيل مستحقة قريباً',
            'breached' => 'تم تجاوز وقت استجابة مشكلة التوصيل',
        ],
    ],
    'settlements' => [
        'adjustment_requires_delivered' => 'لا يمكن إنشاء التسويات إلا للطلبات المسلّمة.',
        'export_headers' => [
            'id' => 'رقم القيد',
            'order_uuid' => 'رقم الطلب',
            'merchant_name' => 'اسم التاجر',
            'rider_name' => 'اسم المندوب',
            'entry_type' => 'نوع القيد',
            'amount_minor' => 'المبلغ',
            'currency' => 'العملة',
            'notes' => 'ملاحظات',
            'occurred_at' => 'تاريخ العملية',
        ],
    ],
    'notifications' => [
        'actions' => [
            'open_delivery' => 'فتح شاشة التوصيل',
            'open_merchant_board' => 'فتح لوحة التاجر',
            'open_order_tracking' => 'فتح تتبع الطلب',
        ],
        'support_author' => 'دعم طلبكس',
        'customer' => [
            'accepted' => [
                'title' => 'تم قبول طلبك',
                'body' => 'قبل :merchant الطلب :order وبدأ التنفيذ.',
            ],
            'preparing' => [
                'title' => 'طلبك قيد التحضير',
                'body' => 'يقوم :merchant بتحضير الطلب :order.',
            ],
            'ready_for_pickup' => [
                'title' => 'طلبك شبه جاهز',
                'body' => 'الطلب :order جاهز لاستلام المندوب من :branch.',
            ],
            'assigned' => [
                'title' => 'تم إسناد مندوب',
                'body' => 'يتجه :rider إلى :branch للطلب :order.',
            ],
            'picked_up' => [
                'title' => 'تم استلام الطلب',
                'body' => 'استلم :rider الطلب :order ويتجه إليك.',
            ],
            'delivered' => [
                'title' => 'تم تسليم الطلب',
                'body' => 'تم تعليم الطلب :order كمسلّم. تواصل مع الدعم إذا وجدت أي مشكلة.',
            ],
            'cancelled' => [
                'title' => 'تم إلغاء الطلب',
                'body' => 'تم إلغاء الطلب :order. يمكن للدعم مساعدتك إذا احتجت طلباً بديلاً.',
            ],
            'support_note' => [
                'title' => 'قام الدعم بتحديث طلبك',
                'body' => 'أضاف :author ملاحظة إلى الطلب :order: :snippet',
            ],
        ],
        'merchant' => [
            'accepted' => [
                'title' => 'تم قبول الطلب',
                'body' => 'تم قبول الطلب :order والالتزام بتحضيره في :branch.',
            ],
            'assigned' => [
                'title' => 'تم إسناد مندوب',
                'body' => 'تم إسناد :rider للطلب :order من :branch.',
            ],
            'picked_up' => [
                'title' => 'تم استلام الطلب',
                'body' => 'أكد :rider استلام الطلب :order.',
            ],
            'delivered' => [
                'title' => 'تم تسليم الطلب',
                'body' => 'تم تسليم الطلب :order إلى :customer.',
            ],
            'cancelled' => [
                'title' => 'تم إلغاء الطلب',
                'body' => 'تم إلغاء الطلب :order بعد قبول التاجر.',
            ],
            'support_note' => [
                'title' => 'قام الدعم بتحديث طلب نشط',
                'body' => 'أضاف الدعم ملاحظة إلى الطلب :order للعميل :customer: :snippet',
            ],
        ],
        'rider' => [
            'assigned' => [
                'title' => 'مهمة توصيل جديدة',
                'body' => 'اتجه إلى :branch للطلب :order وأكد القبول عندما تكون جاهزاً.',
            ],
            'cancelled' => [
                'title' => 'تم إلغاء المهمة',
                'body' => 'الطلب :order لم يعد نشطاً. عُد إلى قائمة المهام.',
            ],
            'support_note' => [
                'title' => 'قام الدعم بتحديث موقع التسليم',
                'body' => 'أضاف الدعم تعليمات تسليم للطلب :order: :snippet',
            ],
        ],
        'generic' => [
            'title' => 'تم تحديث الطلب :order',
            'body' => 'أصبح الطلب :order الآن :status.',
            'support_title' => 'قام الدعم بتحديث طلبك',
            'support_body' => 'أضاف الدعم ملاحظة للطلب :order.',
        ],
        'fallbacks' => [
            'merchant' => 'التاجر',
            'branch' => 'الفرع',
            'merchant_branch' => 'فرعك',
            'rider' => 'مندوب',
            'customer_rider' => 'مندوبك',
            'merchant_rider' => 'المندوب',
            'customer' => 'العميل',
        ],
    ],
];
