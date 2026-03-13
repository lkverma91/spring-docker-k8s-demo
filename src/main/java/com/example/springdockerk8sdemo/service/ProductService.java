package com.example.springdockerk8sdemo.service;

import com.example.springdockerk8sdemo.dto.PagedResponse;
import com.example.springdockerk8sdemo.dto.ProductRequest;
import com.example.springdockerk8sdemo.dto.ProductResponse;

import java.util.UUID;

public interface ProductService {

    ProductResponse createProduct(ProductRequest request);

    ProductResponse getProductById(UUID id);

    PagedResponse<ProductResponse> getAllProducts(int page, int size, String sortBy, String sortDir);

    PagedResponse<ProductResponse> searchProducts(String search, int page, int size);

    PagedResponse<ProductResponse> getProductsByCategory(String category, int page, int size);

    ProductResponse updateProduct(UUID id, ProductRequest request);

    ProductResponse patchProductStock(UUID id, int stock);

    void deleteProduct(UUID id);
}
