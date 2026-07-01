package com.fabrica.order.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

/**
 * The configuration snapshot the storefront submits at checkout. These values are
 * frozen onto the order — the service does not re-price against the catalog.
 */
public record CheckoutRequest(
        @NotBlank String productId,

        @NotNull
        @Pattern(regexp = "PLA|ABS|PETG|resin", message = "material must be one of PLA, ABS, PETG, resin")
        String material,

        String color,

        @NotNull
        @Pattern(regexp = "S|M|L", message = "sizeLabel must be one of S, M, L")
        String sizeLabel,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false, message = "weightG must be positive")
        BigDecimal weightG,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false, message = "unitPrice must be positive")
        BigDecimal unitPrice,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false, message = "totalPrice must be positive")
        BigDecimal totalPrice
) {
}
