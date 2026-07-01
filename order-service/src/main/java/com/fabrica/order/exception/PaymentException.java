package com.fabrica.order.exception;

/** Thrown when a call to the Stripe API fails while creating a checkout session. */
public class PaymentException extends RuntimeException {

    public PaymentException(String message, Throwable cause) {
        super(message, cause);
    }
}
