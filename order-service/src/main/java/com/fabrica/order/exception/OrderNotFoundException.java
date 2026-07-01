package com.fabrica.order.exception;

import java.util.UUID;

/** Thrown when an order id does not resolve, or is not visible to the caller. */
public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException(UUID id) {
        super("Order not found: " + id);
    }
}
