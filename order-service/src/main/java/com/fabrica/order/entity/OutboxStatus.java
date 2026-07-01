package com.fabrica.order.entity;

/** Publication state of an outbox row. Persisted as VARCHAR. */
public enum OutboxStatus {
    PENDING,
    PUBLISHED
}
