package com.fabrica.order.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Stripe credentials and the public URLs Checkout redirects back to. */
@ConfigurationProperties(prefix = "stripe")
public record StripeProperties(
        String secretKey,
        String webhookSecret,
        String successUrl,
        String cancelUrl
) {
}
