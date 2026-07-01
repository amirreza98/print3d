package com.fabrica.order.service;

import com.fabrica.order.config.StripeProperties;
import com.fabrica.order.entity.Order;
import com.fabrica.order.exception.PaymentException;
import com.fabrica.order.exception.WebhookVerificationException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Thin boundary around the Stripe SDK: create Checkout Sessions and verify webhooks. */
@Service
public class StripeService {

    private static final String CURRENCY = "usd";

    private final StripeProperties properties;

    public StripeService(StripeProperties properties) {
        this.properties = properties;
    }

    /**
     * Create a hosted Checkout Session for an order. The order id travels as both the
     * client reference id and metadata so the completed-session webhook can be matched
     * back even if the session id lookup changes.
     */
    public Session createCheckoutSession(Order order) {
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(properties.successUrl())
                .setCancelUrl(properties.cancelUrl())
                .setClientReferenceId(order.getId().toString())
                .putMetadata("order_id", order.getId().toString())
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                .setCurrency(CURRENCY)
                                .setUnitAmount(toMinorUnits(order.getConfiguration().getTotalPrice()))
                                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                        .setName("3D print: " + order.getConfiguration().getProductId())
                                        .build())
                                .build())
                        .build())
                .build();
        try {
            return Session.create(params);
        } catch (StripeException e) {
            throw new PaymentException("Failed to create Stripe Checkout Session", e);
        }
    }

    /** Verify the webhook signature against the raw body and reconstruct the event. */
    public Event constructEvent(String payload, String signatureHeader) {
        try {
            return Webhook.constructEvent(payload, signatureHeader, properties.webhookSecret());
        } catch (SignatureVerificationException e) {
            throw new WebhookVerificationException("Invalid Stripe webhook signature", e);
        }
    }

    private long toMinorUnits(BigDecimal amount) {
        return amount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
