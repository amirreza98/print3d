package com.fabrica.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

/** A material/size price line supplied by an admin when creating or updating a product. */
public record MaterialPriceRequest(
        @NotNull
        @Pattern(regexp = "PLA|ABS|PETG|resin", message = "material must be one of PLA, ABS, PETG, resin")
        String material,

        @NotNull
        @Pattern(regexp = "S|M|L", message = "sizeLabel must be one of S, M, L")
        String sizeLabel,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false, message = "pricePerGram must be positive")
        BigDecimal pricePerGram
) {
}
