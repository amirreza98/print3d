package com.fabrica.product.service;

import com.fabrica.product.dto.MaterialPriceRequest;
import com.fabrica.product.dto.ProductDetailDto;
import com.fabrica.product.dto.ProductRequest;
import com.fabrica.product.dto.ProductSummaryDto;
import com.fabrica.product.entity.MaterialPrice;
import com.fabrica.product.entity.Product;
import com.fabrica.product.exception.ProductAlreadyExistsException;
import com.fabrica.product.exception.ProductNotFoundException;
import com.fabrica.product.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /** All active products, oldest first — the public catalog. */
    @Transactional(readOnly = true)
    public List<ProductSummaryDto> listActive() {
        return productRepository.findByActiveTrueOrderByCreatedAtAsc().stream()
                .map(ProductMapper::toSummary)
                .toList();
    }

    /** A single active product with its available materials. */
    @Transactional(readOnly = true)
    public ProductDetailDto getActive(String id) {
        Product product = productRepository.findWithMaterialPricesById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ProductNotFoundException(id));
        return ProductMapper.toDetail(product);
    }

    @Transactional
    public ProductDetailDto create(ProductRequest request) {
        if (productRepository.existsById(request.id())) {
            throw new ProductAlreadyExistsException(request.id());
        }
        Product product = Product.builder()
                .id(request.id())
                .name(request.name())
                .description(request.description())
                .stlS3Key(request.stlS3Key())
                .thumbnailS3Key(request.thumbnailS3Key())
                .basePrice(request.basePrice())
                .active(request.active() == null || request.active())
                .build();
        applyMaterialPrices(product, request.materialPrices());
        return ProductMapper.toDetail(productRepository.save(product));
    }

    @Transactional
    public ProductDetailDto update(String id, ProductRequest request) {
        Product product = productRepository.findWithMaterialPricesById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        product.setName(request.name());
        product.setDescription(request.description());
        product.setStlS3Key(request.stlS3Key());
        product.setThumbnailS3Key(request.thumbnailS3Key());
        product.setBasePrice(request.basePrice());
        if (request.active() != null) {
            product.setActive(request.active());
        }

        // Material prices are optional on update; when supplied they replace the full set.
        if (request.materialPrices() != null) {
            product.getMaterialPrices().clear();
            applyMaterialPrices(product, request.materialPrices());
        }
        return ProductMapper.toDetail(productRepository.save(product));
    }

    @Transactional
    public void delete(String id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }
        productRepository.deleteById(id);
    }

    private void applyMaterialPrices(Product product, List<MaterialPriceRequest> requests) {
        if (requests == null) {
            return;
        }
        for (MaterialPriceRequest req : requests) {
            product.addMaterialPrice(MaterialPrice.builder()
                    .material(req.material())
                    .sizeLabel(req.sizeLabel())
                    .pricePerGram(req.pricePerGram())
                    .build());
        }
    }
}
