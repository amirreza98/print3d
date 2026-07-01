package com.fabrica.order.controller;

import com.fabrica.order.dto.CheckoutRequest;
import com.fabrica.order.dto.CheckoutResponse;
import com.fabrica.order.dto.OrderDto;
import com.fabrica.order.dto.UpdateStatusRequest;
import com.fabrica.order.exception.ForbiddenException;
import com.fabrica.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Orders API. Every route except the Stripe webhook trusts the gateway-forwarded identity
 * headers {@code X-User-Id} / {@code X-User-Role}; this assumes the gateway is the sole
 * public entry point and strips any client-supplied copies of those headers. Owner-only
 * routes require {@code X-User-Role: OWNER} and return 403 otherwise.
 */
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final String OWNER_ROLE = "OWNER";

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse checkout(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CheckoutRequest request) {
        requireUser(userId);
        return orderService.checkout(userId, request);
    }

    /**
     * Stripe webhook. The raw body is required for signature verification, so it is bound
     * as a String rather than a parsed object. Always answers 200 once verified/idempotent
     * so Stripe stops retrying.
     */
    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestHeader("Stripe-Signature") String signature,
            @RequestBody String payload) {
        orderService.handleWebhook(payload, signature);
        return ResponseEntity.ok("ok");
    }

    @GetMapping("/{id}")
    public OrderDto get(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID id) {
        requireUser(userId);
        return orderService.getOrder(userId, role, id);
    }

    @GetMapping
    public List<OrderDto> list(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireUser(userId);
        return orderService.listOrders(userId, role);
    }

    @PatchMapping("/{id}/status")
    public OrderDto updateStatus(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request) {
        requireOwner(role);
        return orderService.updateStatus(id, request);
    }

    private void requireUser(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new ForbiddenException("Missing authenticated user identity");
        }
    }

    private void requireOwner(String role) {
        if (!OWNER_ROLE.equalsIgnoreCase(role)) {
            throw new ForbiddenException("This operation requires the owner role");
        }
    }
}
