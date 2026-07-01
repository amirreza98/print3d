package com.fabrica.product.dto;

import java.math.BigDecimal;
import java.util.List;

/** Lightweight product view for the public list endpoint. */
public record ProductSummaryDto(
        String id,
        String name,
        String description,
        String stlS3Key,
        String thumbnailS3Key,
        BigDecimal basePrice,
        List<String> availableMaterials
) {
}
