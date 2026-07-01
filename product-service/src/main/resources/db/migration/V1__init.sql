-- Core catalog schema. Owned entirely by Flyway; Hibernate only validates against it.

CREATE TABLE product (
    id               VARCHAR(100)   PRIMARY KEY,
    name             VARCHAR(255)   NOT NULL,
    description      TEXT,
    stl_s3_key       VARCHAR(512),
    thumbnail_s3_key VARCHAR(512),
    base_price       NUMERIC(10, 2) NOT NULL,
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE material_price (
    id              UUID           PRIMARY KEY,
    product_id      VARCHAR(100)   NOT NULL REFERENCES product (id) ON DELETE CASCADE,
    material        VARCHAR(20)    NOT NULL CHECK (material IN ('PLA', 'ABS', 'PETG', 'resin')),
    size_label      VARCHAR(5)     NOT NULL CHECK (size_label IN ('S', 'M', 'L')),
    price_per_gram  NUMERIC(10, 4) NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT uq_material_price UNIQUE (product_id, material, size_label)
);

CREATE INDEX idx_material_price_product_id ON material_price (product_id);
