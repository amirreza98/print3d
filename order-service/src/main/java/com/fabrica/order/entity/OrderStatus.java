package com.fabrica.order.entity;

/** Lifecycle of an order, from checkout through fulfilment. Persisted as VARCHAR. */
public enum OrderStatus {
    PENDING_PAYMENT,
    PAID,
    PRINTING,
    SHIPPED,
    DELIVERED,
    REFUNDED,
    FAILED
}
