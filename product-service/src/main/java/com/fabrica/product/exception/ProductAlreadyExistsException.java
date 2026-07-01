package com.fabrica.product.exception;

/** Thrown when creating a product whose slug is already taken. */
public class ProductAlreadyExistsException extends RuntimeException {

    public ProductAlreadyExistsException(String id) {
        super("Product already exists: " + id);
    }
}
