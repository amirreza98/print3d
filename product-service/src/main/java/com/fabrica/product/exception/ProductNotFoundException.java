package com.fabrica.product.exception;

/** Thrown when a product slug does not resolve to a (visible) product. */
public class ProductNotFoundException extends RuntimeException {

    public ProductNotFoundException(String id) {
        super("Product not found: " + id);
    }
}
