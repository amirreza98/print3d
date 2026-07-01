package com.fabrica.order.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * The product configuration as it was at order time. These columns live on the
 * {@code orders} table and are copied from the request, never referenced back to
 * the catalog — so a later price or catalog change cannot alter a placed order.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfigurationSnapshot {

    @Column(name = "product_id", length = 100, nullable = false)
    private String productId;

    @Column(name = "material", length = 20, nullable = false)
    private String material;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "size_label", length = 5, nullable = false)
    private String sizeLabel;

    @Column(name = "weight_g", nullable = false, precision = 10, scale = 2)
    private BigDecimal weightG;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;
}
