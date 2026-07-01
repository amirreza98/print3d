package com.fabrica.order.repository;

import com.fabrica.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    Optional<Order> findByStripeSessionId(String stripeSessionId);
}
