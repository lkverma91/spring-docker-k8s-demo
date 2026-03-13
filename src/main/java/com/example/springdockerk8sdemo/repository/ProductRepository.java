package com.example.springdockerk8sdemo.repository;

import com.example.springdockerk8sdemo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIgnoreCaseAndActiveTrue(String category, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(p.category) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);
}
