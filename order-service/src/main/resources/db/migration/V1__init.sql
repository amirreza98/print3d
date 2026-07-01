-- Order schema, owned entirely by Flyway. Hibernate only validates against it.

CREATE TABLE orders (
    id                       UUID           PRIMARY KEY,
    user_id                  VARCHAR(255)   NOT NULL,

    -- Frozen configuration snapshot: copied at order time so later catalog/price
    -- changes never mutate an existing order.
    product_id               VARCHAR(100)   NOT NULL,
    material                 VARCHAR(20)    NOT NULL,
    color                    VARCHAR(50),
    size_label               VARCHAR(5)     NOT NULL,
    weight_g                 NUMERIC(10, 2) NOT NULL,
    unit_price               NUMERIC(10, 2) NOT NULL,
    total_price              NUMERIC(10, 2) NOT NULL,

    status                   VARCHAR(20)    NOT NULL
        CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'PRINTING', 'SHIPPED',
                          'DELIVERED', 'REFUNDED', 'FAILED')),

    stripe_session_id        VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    tracking_number          VARCHAR(255),

    created_at               TIMESTAMPTZ    NOT NULL DEFAULT now(),
    paid_at                  TIMESTAMPTZ,
    shipped_at               TIMESTAMPTZ,
    delivered_at             TIMESTAMPTZ
);

CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_stripe_session_id ON orders (stripe_session_id);

-- Idempotency ledger: a Stripe event id is inserted here in the same transaction
-- as the order update it drives, so an event is never processed twice.
CREATE TABLE processed_stripe_event (
    event_id     VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Transactional outbox: an order state change writes an order row and an outbox
-- row in one transaction; a poller later publishes PENDING rows to Kafka.
CREATE TABLE outbox (
    id           UUID         PRIMARY KEY,
    aggregate_id UUID         NOT NULL,
    event_type   VARCHAR(100) NOT NULL,
    payload      JSONB        NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'PUBLISHED')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_status ON outbox (status);
