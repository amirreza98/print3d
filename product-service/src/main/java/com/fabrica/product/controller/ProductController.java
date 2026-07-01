package com.fabrica.product.controller;

import com.fabrica.product.dto.ProductDetailDto;
import com.fabrica.product.dto.ProductRequest;
import com.fabrica.product.dto.ProductSummaryDto;
import com.fabrica.product.exception.ForbiddenException;
import com.fabrica.product.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * Public catalog reads plus owner-only writes. The gateway authenticates the caller and
 * forwards their role in the {@code X-User-Role} header; this service trusts that header.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private static final String OWNER_ROLE = "OWNER";

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductSummaryDto> list() {
        return productService.listActive();
    }

    @GetMapping("/{id}")
    public ProductDetailDto get(@PathVariable String id) {
        return productService.getActive(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<ProductDetailDto> create(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody ProductRequest request,
            UriComponentsBuilder uriBuilder) {
        requireOwner(role);
        ProductDetailDto created = productService.create(request);
        URI location = uriBuilder.path("/api/products/{id}").buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public ProductDetailDto update(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String id,
            @Valid @RequestBody ProductRequest request) {
        requireOwner(role);
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String id) {
        requireOwner(role);
        productService.delete(id);
    }

    private void requireOwner(String role) {
        if (!OWNER_ROLE.equalsIgnoreCase(role)) {
            throw new ForbiddenException("This operation requires the owner role");
        }
    }
}
