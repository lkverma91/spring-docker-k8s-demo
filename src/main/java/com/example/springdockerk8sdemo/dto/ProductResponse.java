package com.example.springdockerk8sdemo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Product response payload")
public class ProductResponse {

    @Schema(description = "Unique product identifier")
    private UUID id;

    @Schema(description = "Product name")
    private String name;

    @Schema(description = "Product description")
    private String description;

    @Schema(description = "Product price")
    private BigDecimal price;

    @Schema(description = "Product category")
    private String category;

    @Schema(description = "Available stock quantity")
    private Integer stock;

    @Schema(description = "Whether the product is active")
    private Boolean active;

    @Schema(description = "Timestamp when the product was created")
    private LocalDateTime createdAt;

    @Schema(description = "Timestamp when the product was last updated")
    private LocalDateTime updatedAt;
}
