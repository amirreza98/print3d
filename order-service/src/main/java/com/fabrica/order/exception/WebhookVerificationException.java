package com.fabrica.order.exception;

/** Thrown when a Stripe webhook payload fails signature verification. */
public class WebhookVerificationException extends RuntimeException {

    public WebhookVerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
