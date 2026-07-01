package com.fabrica.product.service;

import com.fabrica.product.dto.MaterialPriceDto;
import com.fabrica.product.dto.ProductDetailDto;
import com.fabrica.product.dto.ProductSummaryDto;
import com.fabrica.product.entity.MaterialPrice;
import com.fabrica.product.entity.Product;

import java.util.Comparator;
import java.util.List;

/** Translates entities into the DTOs the API exposes. Entities never cross the controller boundary. */
final class ProductMapper {

    private ProductMapper() {
    }

    static List<String> availableMaterials(Product product) {
        return product.getMaterialPrices().stream()
                .map(MaterialPrice::getMaterial)
                .distinct()
                .sorted()
                .toList();
    }

    static ProductSummaryDto toSummary(Product product) {
        return new ProductSummaryDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getStlS3Key(),
                product.getThumbnailS3Key(),
                product.getBasePrice(),
                availableMaterials(product)
        );
    }

    static MaterialPriceDto toDto(MaterialPrice price) {
        return new MaterialPriceDto(
                price.getId(),
                price.getMaterial(),
                price.getSizeLabel(),
                price.getPricePerGram()
        );
    }

    static ProductDetailDto toDetail(Product product) {
        List<MaterialPriceDto> prices = product.getMaterialPrices().stream()
                .sorted(Comparator.comparing(MaterialPrice::getMaterial)
                        .thenComparing(MaterialPrice::getSizeLabel))
                .map(ProductMapper::toDto)
                .toList();
        return new ProductDetailDto(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getStlS3Key(),
                product.getThumbnailS3Key(),
                product.getBasePrice(),
                product.isActive(),
                product.getCreatedAt(),
                availableMaterials(product),
                prices
        );
    }
}
