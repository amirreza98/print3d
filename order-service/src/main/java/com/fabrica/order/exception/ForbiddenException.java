package com.fabrica.order.exception;

/** Thrown when a caller lacks the identity or role required for an operation. */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
