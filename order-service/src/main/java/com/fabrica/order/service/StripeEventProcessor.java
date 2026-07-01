package com.fabrica.order.service;

import com.fabrica.order.entity.Order;
import com.fabrica.order.entity.OrderStatus;
import com.fabrica.order.entity.ProcessedStripeEvent;
import com.fabrica.order.repository.OrderRepository;
import com.fabrica.order.repository.ProcessedStripeEventRepository;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Processes a verified Stripe event in a single transaction. Lives in its own bean so the
 * {@code @Transactional} boundary is applied by the Spring proxy (a self-invocation from the
 * caller would silently skip it).
 *
 * <p>Idempotency: the event id is written to {@code processed_stripe_event} in the same
 * transaction as the order mutation. A duplicate delivery either short-circuits on the
 * existence check or loses the primary-key race and rolls back — so an event is applied once.
 */
@Service
public class StripeEventProcessor {

    private static final Logger log = LoggerFactory.getLogger(StripeEventProcessor.class);

    private final OrderRepository orderRepository;
    private final ProcessedStripeEventRepository processedEventRepository;
    private final OutboxService outboxService;

    public StripeEventProcessor(OrderRepository orderRepository,
                                ProcessedStripeEventRepository processedEventRepository,
                                OutboxService outboxService) {
        this.orderRepository = orderRepository;
        this.processedEventRepository = processedEventRepository;
        this.outboxService = outboxService;
    }

    @Transactional
    public void process(Event event) {
        if (processedEventRepository.existsById(event.getId())) {
            log.info("Stripe event {} already processed; ignoring", event.getId());
            return;
        }

        if ("checkout.session.completed".equals(event.getType())) {
            handleCheckoutCompleted(event);
        } else {
            log.debug("Ignoring unhandled Stripe event type {}", event.getType());
        }

        processedEventRepository.save(new ProcessedStripeEvent(event.getId()));
    }

    private void handleCheckoutCompleted(Event event) {
        StripeObject object = event.getDataObjectDeserializer().getObject().orElse(null);
        if (!(object instanceof Session session)) {
            log.warn("checkout.session.completed event {} had no deserializable session", event.getId());
            return;
        }

        Order order = orderRepository.findByStripeSessionId(session.getId()).orElse(null);
        if (order == null) {
            log.warn("No order found for Stripe session {}", session.getId());
            return;
        }
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            log.info("Order {} already past PENDING_PAYMENT; skipping", order.getId());
            return;
        }

        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(OffsetDateTime.now());
        order.setStripePaymentIntentId(session.getPaymentIntent());
        orderRepository.save(order);

        // order.paid is emitted for the choreography saga — see README.
        outboxService.write(order.getId(), "order.paid", Map.of(
                "orderId", order.getId().toString(),
                "userId", order.getUserId(),
                "status", order.getStatus().name(),
                "totalPrice", order.getConfiguration().getTotalPrice().toPlainString()
        ));
        log.info("Order {} marked PAID from Stripe session {}", order.getId(), session.getId());
    }
}
