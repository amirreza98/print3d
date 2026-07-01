package com.fabrica.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Admin payload for creating or updating a product. On update the {@code id} in the
 * path wins; the {@code id} here is only used to assign the slug on create.
 */
public record ProductRequest(
        @NotBlank
        @Size(max = 100)
        @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*", message = "id must be a lowercase slug (e.g. phone-stand)")
        String id,

        @NotBlank
        String name,

        String description,

        String stlS3Key,

        String thumbnailS3Key,

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false, message = "basePrice must be positive")
        BigDecimal basePrice,

        Boolean active,

        @Valid
        List<MaterialPriceRequest> materialPrices
) {
}
