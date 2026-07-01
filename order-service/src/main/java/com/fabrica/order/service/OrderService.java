package com.fabrica.order.service;

import com.fabrica.order.dto.CheckoutRequest;
import com.fabrica.order.dto.CheckoutResponse;
import com.fabrica.order.dto.OrderDto;
import com.fabrica.order.dto.UpdateStatusRequest;
import com.fabrica.order.entity.ConfigurationSnapshot;
import com.fabrica.order.entity.Order;
import com.fabrica.order.entity.OrderStatus;
import com.fabrica.order.exception.OrderNotFoundException;
import com.fabrica.order.repository.OrderRepository;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    static final String OWNER_ROLE = "OWNER";

    private final OrderRepository orderRepository;
    private final StripeService stripeService;
    private final StripeEventProcessor stripeEventProcessor;
    private final OutboxService outboxService;

    public OrderService(OrderRepository orderRepository,
                        StripeService stripeService,
                        StripeEventProcessor stripeEventProcessor,
                        OutboxService outboxService) {
        this.orderRepository = orderRepository;
        this.stripeService = stripeService;
        this.stripeEventProcessor = stripeEventProcessor;
        this.outboxService = outboxService;
    }

    // ---- Checkout --------------------------------------------------------------------

    /**
     * Persist a PENDING_PAYMENT order with a frozen config snapshot, open a Stripe
     * Checkout Session, and return its URL. The Stripe call is deliberately outside a
     * long-running DB transaction; the session id is saved back afterwards.
     */
    public CheckoutResponse checkout(String userId, CheckoutRequest request) {
        Order order = Order.builder()
                .userId(userId)
                .status(OrderStatus.PENDING_PAYMENT)
                .configuration(ConfigurationSnapshot.builder()
                        .productId(request.productId())
                        .material(request.material())
                        .color(request.color())
                        .sizeLabel(request.sizeLabel())
                        .weightG(request.weightG())
                        .unitPrice(request.unitPrice())
                        .totalPrice(request.totalPrice())
                        .build())
                .build();
        order = orderRepository.save(order);

        Session session = stripeService.createCheckoutSession(order);
        order.setStripeSessionId(session.getId());
        orderRepository.save(order);

        return new CheckoutResponse(order.getId(), session.getUrl());
    }

    // ---- Webhook (idempotency + outbox) ----------------------------------------------

    /**
     * Verify a Stripe webhook, then hand the event to the transactional processor. The
     * verification has no DB side effects, so it stays outside the transaction; a
     * concurrent duplicate that loses the idempotency race surfaces here as a
     * constraint violation and is swallowed (the event was already applied).
     */
    public void handleWebhook(String payload, String signatureHeader) {
        Event event = stripeService.constructEvent(payload, signatureHeader);
        try {
            stripeEventProcessor.process(event);
        } catch (DataIntegrityViolationException e) {
            log.info("Stripe event {} already processed concurrently; ignoring", event.getId());
        }
    }

    // ---- Reads -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public OrderDto getOrder(String callerId, String callerRole, UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
        if (!isOwner(callerRole) && !order.getUserId().equals(callerId)) {
            // Do not reveal the existence of another user's order.
            throw new OrderNotFoundException(id);
        }
        return OrderMapper.toDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> listOrders(String callerId, String callerRole) {
        List<Order> orders = isOwner(callerRole)
                ? orderRepository.findAllByOrderByCreatedAtDesc()
                : orderRepository.findByUserIdOrderByCreatedAtDesc(callerId);
        return orders.stream().map(OrderMapper::toDto).toList();
    }

    // ---- Fulfilment (owner-only; enforced at the controller) -------------------------

    @Transactional
    public OrderDto updateStatus(UUID id, UpdateStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));

        OrderStatus previous = order.getStatus();
        OrderStatus next = request.status();
        order.setStatus(next);

        switch (next) {
            case SHIPPED -> {
                order.setShippedAt(OffsetDateTime.now());
                if (request.trackingNumber() != null) {
                    order.setTrackingNumber(request.trackingNumber());
                }
            }
            case DELIVERED -> order.setDeliveredAt(OffsetDateTime.now());
            default -> {
                // PRINTING and other transitions carry no extra timestamp.
            }
        }
        orderRepository.save(order);

        // order.status_changed drives fulfilment-side choreography — see README.
        outboxService.write(order.getId(), "order.status_changed", Map.of(
                "orderId", order.getId().toString(),
                "userId", order.getUserId(),
                "from", previous.name(),
                "to", next.name()
        ));
        return OrderMapper.toDto(order);
    }

    private boolean isOwner(String role) {
        return OWNER_ROLE.equalsIgnoreCase(role);
    }
}
