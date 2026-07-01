package com.fabrica.order.service;

import com.fabrica.order.entity.OutboxEvent;
import com.fabrica.order.entity.OutboxStatus;
import com.fabrica.order.repository.OutboxRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Drains the transactional outbox to Kafka. Runs on a fixed schedule, reads PENDING rows
 * oldest-first, publishes each to the {@code order-events} topic keyed by aggregate id, and
 * flips it to PUBLISHED only after the broker acknowledges. If Kafka is unavailable the row
 * stays PENDING and is retried on the next cycle — at-least-once delivery, no lost events.
 */
@Component
public class OutboxPoller {

    private static final Logger log = LoggerFactory.getLogger(OutboxPoller.class);
    private static final long SEND_TIMEOUT_SECONDS = 10;

    private final OutboxRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final String topic;

    public OutboxPoller(OutboxRepository outboxRepository,
                        KafkaTemplate<String, String> kafkaTemplate,
                        @Value("${app.outbox.topic:order-events}") String topic) {
        this.outboxRepository = outboxRepository;
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:5000}")
    public void publishPending() {
        List<OutboxEvent> pending = outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        if (pending.isEmpty()) {
            return;
        }
        log.debug("Outbox poller found {} pending event(s)", pending.size());

        for (OutboxEvent event : pending) {
            try {
                kafkaTemplate.send(topic, event.getAggregateId().toString(), event.getPayload())
                        .get(SEND_TIMEOUT_SECONDS, TimeUnit.SECONDS);
                event.setStatus(OutboxStatus.PUBLISHED);
                event.setPublishedAt(OffsetDateTime.now());
                outboxRepository.save(event);
                log.debug("Published outbox event {} ({})", event.getId(), event.getEventType());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                // Leave the row PENDING; a later cycle retries. Stop early — the broker is
                // likely down for the whole batch.
                log.warn("Failed to publish outbox event {}; will retry next cycle: {}",
                        event.getId(), e.getMessage());
                break;
            }
        }
    }
}
