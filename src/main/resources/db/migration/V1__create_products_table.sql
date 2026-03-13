-- V1: Create products table
CREATE TABLE IF NOT EXISTS products
(
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    stock       INTEGER      NOT NULL DEFAULT 0,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin (to_tsvector('english', name));

-- Seed some sample data
INSERT INTO products (name, description, price, category, stock, active, created_at, updated_at)
VALUES ('MacBook Pro 14"', 'Apple MacBook Pro with M3 chip, 16GB RAM, 512GB SSD', 1999.99, 'Electronics', 25, TRUE, NOW(), NOW()),
       ('Dell XPS 15', 'Dell XPS 15 with Intel Core i9, 32GB RAM, 1TB SSD', 1799.99, 'Electronics', 15, TRUE, NOW(), NOW()),
       ('Sony WH-1000XM5', 'Industry-leading noise canceling wireless headphones', 349.99, 'Electronics', 50, TRUE, NOW(), NOW()),
       ('Ergonomic Office Chair', 'Premium lumbar support ergonomic chair for home office', 459.00, 'Furniture', 10, TRUE, NOW(), NOW()),
       ('Standing Desk', 'Height-adjustable electric standing desk 60x30 inches', 699.99, 'Furniture', 8, TRUE, NOW(), NOW());
