package com.fabrica.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/**
 * Idempotency ledger row. Its presence means a Stripe event id has already been
 * handled; inserting it in the same transaction as the order update guarantees
 * exactly-once processing even if the webhook fires twice.
 */
@Entity
@Table(name = "processed_stripe_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProcessedStripeEvent {

    @Id
    @Column(name = "event_id", length = 255, nullable = false, updatable = false)
    private String eventId;

    @CreationTimestamp
    @Column(name = "processed_at", nullable = false, updatable = false)
    private OffsetDateTime processedAt;

    public ProcessedStripeEvent(String eventId) {
        this.eventId = eventId;
    }
}
