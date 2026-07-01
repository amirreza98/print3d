package com.fabrica.order.service;

import com.fabrica.order.dto.OrderDto;
import com.fabrica.order.entity.ConfigurationSnapshot;
import com.fabrica.order.entity.Order;

/** Translates Order entities into the DTO exposed by the API. */
final class OrderMapper {

    private OrderMapper() {
    }

    static OrderDto toDto(Order order) {
        ConfigurationSnapshot config = order.getConfiguration();
        return new OrderDto(
                order.getId(),
                order.getUserId(),
                config.getProductId(),
                config.getMaterial(),
                config.getColor(),
                config.getSizeLabel(),
                config.getWeightG(),
                config.getUnitPrice(),
                config.getTotalPrice(),
                order.getStatus(),
                order.getTrackingNumber(),
                order.getCreatedAt(),
                order.getPaidAt(),
                order.getShippedAt(),
                order.getDeliveredAt()
        );
    }
}
