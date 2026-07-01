package com.fabrica.product.repository;

import com.fabrica.product.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, String> {

    List<Product> findByActiveTrueOrderByCreatedAtAsc();

    @EntityGraph(attributePaths = "materialPrices")
    Optional<Product> findWithMaterialPricesById(String id);
}
