package com.example.springdockerk8sdemo.service;

import com.example.springdockerk8sdemo.dto.PagedResponse;
import com.example.springdockerk8sdemo.dto.ProductRequest;
import com.example.springdockerk8sdemo.dto.ProductResponse;
import com.example.springdockerk8sdemo.entity.Product;
import com.example.springdockerk8sdemo.exception.ResourceNotFoundException;
import com.example.springdockerk8sdemo.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Unit Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product testProduct;
    private ProductRequest testRequest;
    private UUID productId;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        testProduct = Product.builder()
                .id(productId)
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category("Electronics")
                .stock(10)
                .active(true)
                .build();

        testRequest = ProductRequest.builder()
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category("Electronics")
                .stock(10)
                .active(true)
                .build();
    }

    @Nested
    @DisplayName("Create Product")
    class CreateProduct {

        @Test
        @DisplayName("Should create product successfully")
        void shouldCreateProductSuccessfully() {
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);

            ProductResponse response = productService.createProduct(testRequest);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(productId);
            assertThat(response.getName()).isEqualTo("Test Product");
            assertThat(response.getPrice()).isEqualByComparingTo("99.99");
            verify(productRepository, times(1)).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Get Product By ID")
    class GetProductById {

        @Test
        @DisplayName("Should return product when found")
        void shouldReturnProductWhenFound() {
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

            ProductResponse response = productService.getProductById(productId);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(productId);
            assertThat(response.getName()).isEqualTo("Test Product");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when product not found")
        void shouldThrowExceptionWhenNotFound() {
            UUID unknownId = UUID.randomUUID();
            when(productRepository.findById(unknownId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> productService.getProductById(unknownId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Product");
        }
    }

    @Nested
    @DisplayName("Get All Products")
    class GetAllProducts {

        @Test
        @DisplayName("Should return paginated products")
        void shouldReturnPaginatedProducts() {
            Page<Product> productPage = new PageImpl<>(
                    List.of(testProduct),
                    PageRequest.of(0, 10, Sort.by("createdAt").descending()),
                    1L
            );
            when(productRepository.findByActiveTrue(any(Pageable.class))).thenReturn(productPage);

            PagedResponse<ProductResponse> response = productService.getAllProducts(0, 10, "createdAt", "desc");

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            assertThat(response.getTotalElements()).isEqualTo(1L);
            assertThat(response.isFirst()).isTrue();
            assertThat(response.isLast()).isTrue();
        }
    }

    @Nested
    @DisplayName("Update Product")
    class UpdateProduct {

        @Test
        @DisplayName("Should update product successfully")
        void shouldUpdateProductSuccessfully() {
            ProductRequest updateRequest = ProductRequest.builder()
                    .name("Updated Product")
                    .description("Updated Description")
                    .price(new BigDecimal("149.99"))
                    .category("Electronics")
                    .stock(20)
                    .active(true)
                    .build();

            Product updatedProduct = Product.builder()
                    .id(productId)
                    .name("Updated Product")
                    .description("Updated Description")
                    .price(new BigDecimal("149.99"))
                    .category("Electronics")
                    .stock(20)
                    .active(true)
                    .build();

            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);

            ProductResponse response = productService.updateProduct(productId, updateRequest);

            assertThat(response.getName()).isEqualTo("Updated Product");
            assertThat(response.getPrice()).isEqualByComparingTo("149.99");
        }

        @Test
        @DisplayName("Should throw exception when updating non-existent product")
        void shouldThrowExceptionForNonExistentProduct() {
            UUID unknownId = UUID.randomUUID();
            when(productRepository.findById(unknownId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> productService.updateProduct(unknownId, testRequest))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Patch Stock")
    class PatchStock {

        @Test
        @DisplayName("Should update stock successfully")
        void shouldUpdateStockSuccessfully() {
            Product updated = Product.builder().id(productId).name("Test Product")
                    .price(new BigDecimal("99.99")).category("Electronics")
                    .stock(50).active(true).build();
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(updated);

            ProductResponse response = productService.patchProductStock(productId, 50);

            assertThat(response.getStock()).isEqualTo(50);
        }

        @Test
        @DisplayName("Should throw exception for negative stock")
        void shouldThrowExceptionForNegativeStock() {
            assertThatThrownBy(() -> productService.patchProductStock(productId, -1))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("negative");
        }
    }

    @Nested
    @DisplayName("Delete Product")
    class DeleteProduct {

        @Test
        @DisplayName("Should soft-delete product by marking inactive")
        void shouldSoftDeleteProduct() {
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);

            productService.deleteProduct(productId);

            verify(productRepository).save(argThat(p -> !p.getActive()));
        }

        @Test
        @DisplayName("Should throw exception when deleting non-existent product")
        void shouldThrowExceptionForNonExistentProduct() {
            UUID unknownId = UUID.randomUUID();
            when(productRepository.findById(unknownId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> productService.deleteProduct(unknownId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
