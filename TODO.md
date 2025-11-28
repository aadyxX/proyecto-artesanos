# TODO: Fix Shopping Cart Display

- [x] Update CarritoController index method to use the provided SQL query for fetching cart items
- [x] Add cart item ID (cp.id) and product ID (p.id) to the query
- [x] Format the response to include items with id, cantidad, subtotal, and producto details
- [x] Calculate total by summing subtotal_item
- [x] Handle image URL formatting (use default if no image)

# TODO: Implement Checkout Process

- [x] Create CheckoutController with index and store methods
- [x] Add checkout routes to api.php
- [x] Create checkout.html page with form for shipping data and payment method selection
- [x] Create checkout.css for styling
- [x] Create checkout.js for frontend logic
- [x] Modify carrito.html to redirect to checkout.html on "Finalizar compra" button click
- [x] Implement order creation grouped by artisan
- [x] Implement stock deduction on successful purchase
- [x] Clear cart after successful purchase
- [x] Add validation for stock availability before processing
