package com.fabrica.product.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** A single material/size price line returned to clients. */
public record MaterialPriceDto(
        UUID id,
        String material,
        String sizeLabel,
        BigDecimal pricePerGram
) {
}
