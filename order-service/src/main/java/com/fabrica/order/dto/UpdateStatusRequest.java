package com.fabrica.order.dto;

import com.fabrica.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

/** Owner-only fulfilment update. A tracking number may accompany a SHIPPED transition. */
public record UpdateStatusRequest(
        @NotNull OrderStatus status,
        String trackingNumber
) {
}
