package com.fabrica.product.exception;

/** Thrown when a caller lacks the owner role required for a write operation. */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
