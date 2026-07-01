package com.fabrica.order.service;

import com.fabrica.order.entity.OutboxEvent;
import com.fabrica.order.entity.OutboxStatus;
import com.fabrica.order.repository.OutboxRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Writes domain events into the outbox table. Callers must invoke this from within the
 * same transaction as the state change being recorded — that atomicity is the whole point
 * of the pattern. Publication to Kafka happens later, in {@link OutboxPoller}.
 */
@Service
public class OutboxService {

    private final OutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    public OutboxService(OutboxRepository outboxRepository, ObjectMapper objectMapper) {
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
    }

    public void write(UUID aggregateId, String eventType, Map<String, Object> payload) {
        OutboxEvent event = OutboxEvent.builder()
                .aggregateId(aggregateId)
                .eventType(eventType)
                .payload(serialize(payload))
                .status(OutboxStatus.PENDING)
                .build();
        outboxRepository.save(event);
    }

    private String serialize(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            // A domain payload we build ourselves should always serialize; treat as a bug.
            throw new IllegalStateException("Failed to serialize outbox payload", e);
        }
    }
}
