package com.fabrica.order.dto;

import java.util.UUID;

/** Returned from checkout: the new order id and the Stripe-hosted payment URL to redirect to. */
public record CheckoutResponse(
        UUID orderId,
        String checkoutUrl
) {
}
