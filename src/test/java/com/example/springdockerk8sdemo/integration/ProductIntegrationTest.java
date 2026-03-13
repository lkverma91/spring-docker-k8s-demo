package com.example.springdockerk8sdemo.integration;

import com.example.springdockerk8sdemo.dto.ProductRequest;
import com.example.springdockerk8sdemo.dto.ProductResponse;
import com.example.springdockerk8sdemo.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Product API Integration Tests")
class ProductIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("products_it")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    private static UUID createdProductId;

    @Test
    @Order(1)
    @DisplayName("Should create a product successfully")
    void shouldCreateProduct() throws Exception {
        ProductRequest request = ProductRequest.builder()
                .name("Integration Test Product")
                .description("Created during integration test")
                .price(new BigDecimal("199.99"))
                .category("Testing")
                .stock(100)
                .active(true)
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Integration Test Product"))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        var responseNode = objectMapper.readTree(responseBody);
        createdProductId = UUID.fromString(responseNode.at("/data/id").asText());
        assertThat(createdProductId).isNotNull();
    }

    @Test
    @Order(2)
    @DisplayName("Should retrieve the created product by ID")
    void shouldGetProductById() throws Exception {
        mockMvc.perform(get("/api/v1/products/{id}", createdProductId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(createdProductId.toString()))
                .andExpect(jsonPath("$.data.name").value("Integration Test Product"));
    }

    @Test
    @Order(3)
    @DisplayName("Should return all products with pagination")
    void shouldGetAllProducts() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(org.hamcrest.Matchers.greaterThan(0)));
    }

    @Test
    @Order(4)
    @DisplayName("Should search products by keyword")
    void shouldSearchProducts() throws Exception {
        mockMvc.perform(get("/api/v1/products/search")
                        .param("search", "Integration"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @Order(5)
    @DisplayName("Should update the product")
    void shouldUpdateProduct() throws Exception {
        ProductRequest updateRequest = ProductRequest.builder()
                .name("Updated Integration Product")
                .description("Updated description")
                .price(new BigDecimal("299.99"))
                .category("Testing")
                .stock(50)
                .active(true)
                .build();

        mockMvc.perform(put("/api/v1/products/{id}", createdProductId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Integration Product"))
                .andExpect(jsonPath("$.data.price").value(299.99));
    }

    @Test
    @Order(6)
    @DisplayName("Should update product stock")
    void shouldUpdateStock() throws Exception {
        mockMvc.perform(patch("/api/v1/products/{id}/stock", createdProductId)
                        .param("stock", "75"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stock").value(75));
    }

    @Test
    @Order(7)
    @DisplayName("Should soft-delete the product")
    void shouldDeleteProduct() throws Exception {
        mockMvc.perform(delete("/api/v1/products/{id}", createdProductId))
                .andExpect(status().isNoContent());

        // Verify product is no longer active (soft-delete)
        mockMvc.perform(get("/api/v1/products/{id}", createdProductId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));
    }

    @Test
    @Order(8)
    @DisplayName("Should return 404 for non-existent product")
    void shouldReturn404ForNonExistentProduct() throws Exception {
        mockMvc.perform(get("/api/v1/products/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @Order(9)
    @DisplayName("Should return 400 for invalid product request")
    void shouldReturn400ForInvalidRequest() throws Exception {
        ProductRequest invalidRequest = ProductRequest.builder()
                .name("")
                .price(new BigDecimal("-10"))
                .category("")
                .stock(-5)
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }
}
