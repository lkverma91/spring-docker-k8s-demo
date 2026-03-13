package com.example.springdockerk8sdemo.controller;

import com.example.springdockerk8sdemo.dto.PagedResponse;
import com.example.springdockerk8sdemo.dto.ProductRequest;
import com.example.springdockerk8sdemo.dto.ProductResponse;
import com.example.springdockerk8sdemo.exception.GlobalExceptionHandler;
import com.example.springdockerk8sdemo.exception.ResourceNotFoundException;
import com.example.springdockerk8sdemo.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
@DisplayName("ProductController Unit Tests")
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductService productService;

    private ProductResponse testProductResponse;
    private ProductRequest testProductRequest;
    private UUID productId;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        testProductResponse = ProductResponse.builder()
                .id(productId)
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category("Electronics")
                .stock(10)
                .active(true)
                .build();

        testProductRequest = ProductRequest.builder()
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category("Electronics")
                .stock(10)
                .active(true)
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/products")
    class CreateProduct {

        @Test
        @DisplayName("Should return 201 Created on valid request")
        void shouldReturn201OnValidRequest() throws Exception {
            when(productService.createProduct(any(ProductRequest.class))).thenReturn(testProductResponse);

            mockMvc.perform(post("/api/v1/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testProductRequest)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("Test Product"))
                    .andExpect(jsonPath("$.data.price").value(99.99));
        }

        @Test
        @DisplayName("Should return 400 Bad Request when name is blank")
        void shouldReturn400WhenNameIsBlank() throws Exception {
            testProductRequest.setName("");

            mockMvc.perform(post("/api/v1/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testProductRequest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors").isArray());
        }

        @Test
        @DisplayName("Should return 400 Bad Request when price is negative")
        void shouldReturn400WhenPriceIsNegative() throws Exception {
            testProductRequest.setPrice(new BigDecimal("-1.00"));

            mockMvc.perform(post("/api/v1/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testProductRequest)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("GET /api/v1/products/{id}")
    class GetProductById {

        @Test
        @DisplayName("Should return 200 with product when found")
        void shouldReturn200WhenFound() throws Exception {
            when(productService.getProductById(productId)).thenReturn(testProductResponse);

            mockMvc.perform(get("/api/v1/products/{id}", productId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(productId.toString()));
        }

        @Test
        @DisplayName("Should return 404 when product not found")
        void shouldReturn404WhenNotFound() throws Exception {
            when(productService.getProductById(productId))
                    .thenThrow(new ResourceNotFoundException("Product", "id", productId));

            mockMvc.perform(get("/api/v1/products/{id}", productId))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/products")
    class GetAllProducts {

        @Test
        @DisplayName("Should return 200 with paginated products")
        void shouldReturn200WithPaginatedProducts() throws Exception {
            PagedResponse<ProductResponse> pagedResponse = PagedResponse.<ProductResponse>builder()
                    .content(List.of(testProductResponse))
                    .page(0).size(10).totalElements(1L).totalPages(1)
                    .first(true).last(true)
                    .build();

            when(productService.getAllProducts(anyInt(), anyInt(), anyString(), anyString()))
                    .thenReturn(pagedResponse);

            mockMvc.perform(get("/api/v1/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(1))
                    .andExpect(jsonPath("$.data.content[0].name").value("Test Product"));
        }
    }

    @Nested
    @DisplayName("PUT /api/v1/products/{id}")
    class UpdateProduct {

        @Test
        @DisplayName("Should return 200 on successful update")
        void shouldReturn200OnUpdate() throws Exception {
            when(productService.updateProduct(eq(productId), any(ProductRequest.class)))
                    .thenReturn(testProductResponse);

            mockMvc.perform(put("/api/v1/products/{id}", productId)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(testProductRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(productId.toString()));
        }
    }

    @Nested
    @DisplayName("DELETE /api/v1/products/{id}")
    class DeleteProduct {

        @Test
        @DisplayName("Should return 204 on successful deletion")
        void shouldReturn204OnDelete() throws Exception {
            doNothing().when(productService).deleteProduct(productId);

            mockMvc.perform(delete("/api/v1/products/{id}", productId))
                    .andExpect(status().isNoContent());

            verify(productService, times(1)).deleteProduct(productId);
        }
    }
}
