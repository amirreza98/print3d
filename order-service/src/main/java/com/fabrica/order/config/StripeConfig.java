package com.fabrica.order.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/** Wires the global Stripe API key from configuration at startup. */
@Configuration
@EnableConfigurationProperties(StripeProperties.class)
public class StripeConfig {

    private final StripeProperties properties;

    public StripeConfig(StripeProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() {
        Stripe.apiKey = properties.secretKey();
    }
}
