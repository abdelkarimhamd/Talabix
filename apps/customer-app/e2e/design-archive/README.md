# Customer App UI Kit

Expo/React Native customer mobile app recreation in HTML/React.

## Screens
- **Home** — address header, search bar, promo banner, category tiles, merchant cards
- **Merchant detail** — food artwork, menu items, add to cart
- **Cart** — line items, price summary, checkout CTA
- **Order tracking** — live status timeline, price breakdown

## Usage
Open `index.html` in a browser. The phone frame is 390×844px (iPhone 14 ratio).
Tap merchants to navigate to their menu. Add items to the cart using the + button.
Use the floating cart button to view the cart, then checkout to see tracking.

## Design tokens (from `apps/customer-app/src/ui.js`)
- Primary: `#ffe500` yellow
- Ink: `#202124`
- Green (eyebrow/success): `#15945f`
- Card radius: 14px, border-top accent: 3px
- Body font: system-ui (no web font — React Native native)
- Heading weight: 900
