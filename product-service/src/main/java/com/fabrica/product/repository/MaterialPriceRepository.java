package com.fabrica.product.repository;

import com.fabrica.product.entity.MaterialPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MaterialPriceRepository extends JpaRepository<MaterialPrice, UUID> {
}
