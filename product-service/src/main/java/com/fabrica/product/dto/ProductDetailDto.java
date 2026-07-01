package com.fabrica.product.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/** Full product view including derived materials and every price line. */
public record ProductDetailDto(
        String id,
        String name,
        String description,
        String stlS3Key,
        String thumbnailS3Key,
        BigDecimal basePrice,
        boolean active,
        OffsetDateTime createdAt,
        List<String> availableMaterials,
        List<MaterialPriceDto> materialPrices
) {
}
