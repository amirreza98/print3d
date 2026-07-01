package com.fabrica.order.dto;

import com.fabrica.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/** Full order view returned to clients. Entities never cross the controller boundary. */
public record OrderDto(
        UUID id,
        String userId,
        String productId,
        String material,
        String color,
        String sizeLabel,
        BigDecimal weightG,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        OrderStatus status,
        String trackingNumber,
        OffsetDateTime createdAt,
        OffsetDateTime paidAt,
        OffsetDateTime shippedAt,
        OffsetDateTime deliveredAt
) {
}
