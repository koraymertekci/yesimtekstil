-- ============================================
-- YESİM TÜRKİYE TEKSTIL VERITABANI SCHEMA
-- ============================================

-- ============================================
-- 1. KULLANICILAR (Users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'operator', 'viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 2. MÜŞTERİLER (Customers)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 3. TEDARIKÇILER (Suppliers)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 4. ÜRÜNLER (Products)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    unit VARCHAR(50),
    unit_cost DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 5. STOKLAR (Stocks) - MVC MODEL
-- ============================================
CREATE TABLE IF NOT EXISTS stocks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    quantity INT DEFAULT 0,
    min_quantity INT DEFAULT 100,
    max_quantity INT,
    supplier_id INT,
    last_purchase_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- ============================================
-- 6. MAKİNELER (Machines)
-- ============================================
CREATE TABLE IF NOT EXISTS machines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    model VARCHAR(100),
    status ENUM('active', 'maintenance', 'broken', 'idle') DEFAULT 'active',
    capacity INT,
    last_maintenance DATE,
    next_maintenance DATE,
    power_consumption DECIMAL(8, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 7. SİPARİŞLER (Orders) - SENARYO 1 & 2
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    status ENUM('pending', 'in_production', 'completed', 'cancelled') DEFAULT 'pending',
    delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    notes TEXT,
    is_late BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- 8. SATIŞLAR (Sales)
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    sale_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- ============================================
-- 9. FİNANSAL KAYITLAR (Finance)
-- ============================================
CREATE TABLE IF NOT EXISTS finance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_type ENUM('revenue', 'expense', 'cost') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    reference_id INT,
    reference_type VARCHAR(50),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. BAKIMI KAYITLARI (Maintenance Records)
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    machine_id INT NOT NULL,
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(100),
    description TEXT,
    cost DECIMAL(10, 2),
    duration_hours INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 11. İNDEKSLER (PERFORMANCE)
-- ============================================

-- Orders indeksleri (sıkça sorgulanır)
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Stocks indeksleri
CREATE INDEX idx_stocks_product_id ON stocks(product_id);
CREATE INDEX idx_stocks_quantity ON stocks(quantity);

-- Sales indeksleri
CREATE INDEX idx_sales_order_id ON sales(order_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);

-- Finance indeksleri
CREATE INDEX idx_finance_date ON finance(date);
CREATE INDEX idx_finance_transaction_type ON finance(transaction_type);

-- ============================================
-- 12. GÖRÜNÜMLER (Views - İsteğe Bağlı)
-- ============================================

-- Geç kalan siparişler
CREATE VIEW late_orders AS
SELECT 
    o.id,
    o.customer_id,
    c.name as customer_name,
    o.product_id,
    p.name as product_name,
    o.quantity,
    o.delivery_date,
    DATEDIFF(CURDATE(), o.delivery_date) as days_late
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN products p ON o.product_id = p.id
WHERE o.delivery_date < CURDATE() 
AND o.status IN ('pending', 'in_production');

-- Günlük satış özeti
CREATE VIEW daily_sales_summary AS
SELECT 
    DATE(s.sale_date) as date,
    COUNT(DISTINCT s.order_id) as order_count,
    SUM(s.quantity) as total_quantity,
    SUM(s.total_amount) as total_revenue
FROM sales s
GROUP BY DATE(s.sale_date);

-- ============================================
-- 13. TRIGGER'LAR (İş Kuralları)
-- ============================================

-- SENARYO 1: Stok yetersizse sipariş verilemez
-- (Application tarafında kontrol edilecek)

-- SENARYO 2: Geçmiş tarih siparişi iptal edilemez
-- (Application tarafında kontrol edilecek)

-- Sipariş iptal edildiğinde stoku geri yükle
DELIMITER //
CREATE TRIGGER IF NOT EXISTS restore_stock_on_cancel
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE stocks
        SET quantity = quantity + NEW.quantity
        WHERE product_id = NEW.product_id;
    END IF;
END //
DELIMITER ;

-- Stok minimum seviyesinin altına düştüğünde uyarı (log)
DELIMITER //
CREATE TRIGGER IF NOT EXISTS check_stock_warning
AFTER UPDATE ON stocks
FOR EACH ROW
BEGIN
    IF NEW.quantity < NEW.min_quantity THEN
        INSERT INTO system_logs (message, severity, created_at)
        VALUES (
            CONCAT('Stock warning for product ID: ', NEW.product_id, '. Current: ', NEW.quantity, ', Minimum: ', NEW.min_quantity),
            'warning',
            NOW()
        );
    END IF;
END //
DELIMITER ;

-- ============================================
-- 14. SİSTEM LOGLARI (System Logs)
-- ============================================
CREATE TABLE IF NOT EXISTS system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 15. BAŞLANGIÇ VERİLERİ (SAMPLE DATA - İsteğe bağlı)
-- ============================================

-- Örnek Kullanıcılar
INSERT IGNORE INTO users (email, password, name, role) VALUES
('admin@yesimtekstil.com', 'hashed_password_here', 'Admin Kullanıcısı', 'admin'),
('manager@yesimtekstil.com', 'hashed_password_here', 'Yönetici', 'manager');

-- Örnek Müşteriler
INSERT IGNORE INTO customers (name, email, phone, city, country) VALUES
('Tekstil Şirketi A', 'contact@texcompany-a.com', '+90 212 123 4567', 'Istanbul', 'Turkey'),
('Tekstil Şirketi B', 'info@texcompany-b.com', '+90 216 765 4321', 'Ankara', 'Turkey');

-- Örnek Tedarikçiler
INSERT IGNORE INTO suppliers (name, email, phone, city, country) VALUES
('Pamuk Üreticisi Ltd.', 'supplier@cotton.com', '+90 232 999 8888', 'Izmir', 'Turkey'),
('Boyacılık Kimya A.Ş.', 'info@dyes.com', '+90 212 555 1111', 'Istanbul', 'Turkey');

-- Örnek Ürünler
INSERT IGNORE INTO products (name, description, category, unit, unit_cost, selling_price) VALUES
('Pamuklu Kumaş (Meter)', 'Doğal pamuktan üretilmiş kumaş', 'Ham Madde', 'meter', 25.50, 35.00),
('Boyali Kumaş (Meter)', '100% Pamuk boyalı kumaş', 'Yarı Mamul', 'meter', 40.00, 60.00),
('Dokuma Tekstil (Adet)', 'Son ürün dokuma tekstil', 'Mamul', 'adet', 150.00, 250.00);

-- Örnek Stoklar
INSERT IGNORE INTO stocks (product_id, quantity, min_quantity, max_quantity, supplier_id) VALUES
(1, 500, 100, 2000, 1),
(2, 300, 100, 1500, 1),
(3, 150, 50, 500, NULL);

-- Örnek Makineler
INSERT IGNORE INTO machines (name, type, model, status, capacity) VALUES
('Dokuma Makinesi #1', 'dokuma', 'MODEL-X1000', 'active', 500),
('Boyama Kuryası #1', 'boyama', 'DYE-2000', 'active', 1000),
('Kesim Makinesi #1', 'kesim', 'CUTTER-300', 'maintenance', 300);

-- ============================================
-- SENARYO AÇIKLAMALARI
-- ============================================

/*
SENARYO 1: STOK YETERSIZSE SİPARİŞ VERİLEMEZ
-----------
Kural: Yeni bir sipariş oluşturulmadan önce, ürünün mevcut stok
       miktarı kontrol edilmeli. İstenen miktar stok miktarından
       fazlaysa sipariş BAŞARISIZ olmalıdır.

Implementation: 
- GET /api/stocks/:product_id ile stok kontrol et
- POST /api/orders'de stok kontrolü yap
- Stok<Quantity ise HTTP 409 Conflict cevap dön

Örnek:
  İstek: POST /api/orders
  {
    "customer_id": 1,
    "product_id": 1,
    "quantity": 600,
    "delivery_date": "2026-02-15"
  }
  
  Cevap (Başarısız):
  {
    "status": "error",
    "code": 409,
    "message": "Yeterli stok bulunmamaktadır. Mevcut stok: 500, İstenen: 600"
  }

SENARYO 2: GEÇMİŞ TARİHLİ SİPARİŞ İPTAL EDİLEMEZ
-----------
Kural: Teslim tarihi geçmiş olan siparişler iptal edilemez.
       Sadece "pending" ve "in_production" durumundaki siparişler iptal edilebilir.

Implementation:
- DELETE /api/orders/:id'de şu kontroller yap:
  1. Siparişin durumu "pending" veya "in_production" olmalı
  2. Siparişin delivery_date'i bugünden sonra olmalı
  3. İkisi de sağlanmazsa HTTP 422 Unprocessable Entity cevap dön

Örnek:
  İstek: DELETE /api/orders/5
  
  Cevap (Başarısız - Tarih geçmiş):
  {
    "status": "error",
    "code": 422,
    "message": "Geçmiş tarihli sipariş iptal edilemez. Teslim Tarihi: 2026-01-10"
  }

  Cevap (Başarısız - Durum Tamamlandı):
  {
    "status": "error",
    "code": 422,
    "message": "Tamamlanan sipariş iptal edilemez. Durum: completed"
  }

SENARYO 3: MAKİNE BAKIMDA SİPARİŞ ATANMAYACAK
-----------
Kural: Bakım (maintenance) durumundaki makinelere yeni sipariş
       atanmayacaktır.

Implementation:
- POST /api/orders'de makine seçilirse machine durumu kontrol et
- Status = 'maintenance' ise sipariş başarısız olmalı

*/
