<?php

return [
    'auth' => [
        'missing_ability' => 'Missing required token ability [:ability].',
    ],
    'validation' => [
        'failed' => 'Please review the required fields.',
    ],
    'mail' => [
        'order_label' => 'Order:',
    ],
    'maps' => [
        'distance_meters' => ':meters m',
        'distance_kilometers' => ':kilometers km',
        'duration_minutes' => '{1} :minutes min|[2,*] :minutes mins',
    ],
    'dispatch' => [
        'fallbacks' => [
            'unassigned_rider' => 'Unassigned rider',
            'unknown_rider' => 'Unknown rider',
        ],
        'locations' => [
            'rider_live_position' => 'Rider live position',
            'rider_location_unavailable' => 'Rider location unavailable',
        ],
        'reassignment' => [
            'terminal_order' => 'Delivered or cancelled orders cannot be reassigned.',
            'same_rider' => 'Select a different rider for reassignment.',
            'unavailable_rider' => 'The selected rider is not available for reassignment.',
            'ineligible_rider' => 'The selected rider is not eligible for this order.',
        ],
        'sla' => [
            'on_track' => 'On track',
            'warning' => 'SLA at risk',
            'breached' => 'SLA breached',
        ],
        'exception_sla' => [
            'on_track' => 'Exception response on track',
            'warning' => 'Exception response due soon',
            'breached' => 'Exception response breached',
        ],
    ],
    'settlements' => [
        'adjustment_requires_delivered' => 'Adjustments can only be created for delivered orders.',
        'export_headers' => [
            'id' => 'id',
            'order_uuid' => 'order_uuid',
            'merchant_name' => 'merchant_name',
            'rider_name' => 'rider_name',
            'entry_type' => 'entry_type',
            'amount_minor' => 'amount_minor',
            'currency' => 'currency',
            'notes' => 'notes',
            'occurred_at' => 'occurred_at',
        ],
    ],
    'notifications' => [
        'actions' => [
            'open_delivery' => 'Open delivery',
            'open_merchant_board' => 'Open merchant board',
            'open_order_tracking' => 'Open order tracking',
        ],
        'support_author' => 'Talabix support',
        'customer' => [
            'accepted' => [
                'title' => 'Your order was accepted',
                'body' => ':merchant accepted order :order and started fulfillment.',
            ],
            'preparing' => [
                'title' => 'Your order is being prepared',
                'body' => ':merchant is preparing order :order.',
            ],
            'ready_for_pickup' => [
                'title' => 'Your order is almost ready',
                'body' => 'Order :order is staged for rider pickup from :branch.',
            ],
            'assigned' => [
                'title' => 'Rider assigned',
                'body' => ':rider is heading to :branch for order :order.',
            ],
            'picked_up' => [
                'title' => 'Order picked up',
                'body' => ':rider picked up order :order and is heading to you.',
            ],
            'delivered' => [
                'title' => 'Order delivered',
                'body' => 'Order :order was marked delivered. Contact support if anything is wrong.',
            ],
            'cancelled' => [
                'title' => 'Order cancelled',
                'body' => 'Order :order was cancelled. Support can help if you need a replacement order.',
            ],
            'support_note' => [
                'title' => 'Support updated your order',
                'body' => ':author added a note to order :order: :snippet',
            ],
        ],
        'merchant' => [
            'accepted' => [
                'title' => 'Order accepted',
                'body' => 'Order :order is accepted and committed for preparation at :branch.',
            ],
            'assigned' => [
                'title' => 'Rider assigned',
                'body' => ':rider is assigned to order :order from :branch.',
            ],
            'picked_up' => [
                'title' => 'Order picked up',
                'body' => ':rider confirmed pickup for order :order.',
            ],
            'delivered' => [
                'title' => 'Order delivered',
                'body' => 'Order :order was delivered to :customer.',
            ],
            'cancelled' => [
                'title' => 'Order cancelled',
                'body' => 'Order :order was cancelled after merchant acceptance.',
            ],
            'support_note' => [
                'title' => 'Support updated an active order',
                'body' => 'Support added a note to order :order for :customer: :snippet',
            ],
        ],
        'rider' => [
            'assigned' => [
                'title' => 'New assignment ready',
                'body' => 'Head to :branch for order :order and confirm acceptance when you are ready.',
            ],
            'cancelled' => [
                'title' => 'Assignment cancelled',
                'body' => 'Order :order is no longer active. Return to the assignment queue.',
            ],
            'support_note' => [
                'title' => 'Support updated the drop-off',
                'body' => 'Support added handoff instructions for order :order: :snippet',
            ],
        ],
        'generic' => [
            'title' => 'Order :order updated',
            'body' => 'Order :order is now :status.',
            'support_title' => 'Support updated your order',
            'support_body' => 'Support added a note for order :order.',
        ],
        'fallbacks' => [
            'merchant' => 'The merchant',
            'branch' => 'the branch',
            'merchant_branch' => 'your branch',
            'rider' => 'A rider',
            'customer_rider' => 'Your rider',
            'merchant_rider' => 'The rider',
            'customer' => 'the customer',
        ],
    ],
];
