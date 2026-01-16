# YESİM TÜRKİYE Tekstil - Karar Destek Sistemi (KDS)

## Proje Açıklaması

Bu proje, **Sunucu Tabanlı Programlama** dersi kapsamında geliştirilmiş bir **RESTful API** uygulamasıdır. Tekstil işletmelerinin üretim ve satış yönetimini kolaylaştırmak üzere tasarlanmıştır.

### Amaç

Öğrencilerin aşağıdaki beceri ve bilgileri kazanmasını sağlamak:
- Sunucu taraflı yazılım geliştirme (Node.js + Express)
- **MVC Mimarisinin** doğru ve tutarlı uygulanması
- **REST prensiplerine** uygun API tasarımı
- Veri modeli, iş mantığı ve uç noktaların ayrıştırılması
- Kod okunabilirliği, sürdürülebilirliği ve ölçeklenebilirliği

---

## Senaryo Tanımı

Uygulama, bir tekstil işletmesinin aşağıdaki işlevleri yönetmesine olanak sağlar:

### 1. **Stok Yönetimi** (Stocks)
- Ham madde ve ürün stokların izlenmesi
- Stok seviyeleri ve tüketim oranları
- Stok tahminlemesi (Forecast)

### 2. **Sipariş Yönetimi** (Orders)
- Müşteri siparişlerinin oluşturulması ve izlenmesi
- Sipariş durumunun takibi (Bekleme, Üretimde, Tamamlandı, İptal)
- Teslim tarihi ve gecikme yönetimi

### 3. **Finansal Yönetim** (Finance)
- Satış geliri izlenmesi
- Maliyet analizi
- Kâr-zarar hesaplaması

### 4. **Makine Yönetimi** (Machines)
- Üretim makinelerinin durumu izlenmesi
- Bakım planlaması
- Kapasite analizi

### 5. **Pazar Analizi** (Market Analysis)
- Pazar eğilim analizi
- Sezonsal tahminler
- Rakip analizi

---

## İş Kuralları (Business Rules)

### Zorunlu Senaryo 1: **Stok Yetersizse Sipariş Verilemez**
```
KURAL: Yeni bir sipariş oluşturulurken, istenen ürün miktarı
       mevcut stok miktarından fazlaysa sipariş GERÇEKLEŞMEDİR.
       
HATA KODU: 409 Conflict
HATA MESAJI: "Yeterli stok bulunmamaktadır. Mevcut stok: X adet"
```

### Zorunlu Senaryo 2: **Geçmiş Tarihli Sipariş Iptal Edilemez**
```
KURAL: Teslim tarihi geçmiş siparişler iptal edilemez.
       Yalnızca "Bekleme" ve "Üretimde" durumundaki siparişler iptal edilebilir.
       
HATA KODU: 422 Unprocessable Entity
HATA MESAJI: "Geçmiş tarihli veya tamamlanan sipariş iptal edilemez."
```

### Senaryo 3: **Makine Bakım Sırasında Üretim Yapılamaz**
```
KURAL: Bakım durumunda olan bir makinaye sipariş atanmayacaktır.

HATA KODU: 409 Conflict
HATA MESAJI: "Seçilen makine bakım durumundadır."
```

---

## Proje Yapısı (MVC Mimarisi)

```
yesimtekstil/
├── app.js                          # Express uygulaması
├── package.json                    # Bağımlılıklar
├── .env                           # Ortam değişkenleri (GİTİGNORE'da)
├── .env.example                   # Ortam değişkenleri şablonu
├── README.md                      # Bu dosya
│
├── db/                            # DATABASE (Model)
│   └── mysql_connect.js           # MySQL bağlantı yapılandırması
│
├── controllers/                   # CONTROLLER (İş Mantığı)
│   ├── orders.controller.js       # Sipariş işlemleri
│   ├── stocks.controller.js       # Stok işlemleri
│   ├── machines.controller.js     # Makine işlemleri
│   ├── sales.controller.js        # Satış işlemleri
│   ├── finance.controller.js      # Finansal işlemler
│   ├── dashboard.controller.js    # Dashboard verileri
│   ├── charts.controller.js       # Grafik verileri
│   └── auth.controller.js         # Kimlik doğrulama
│
├── routers/                       # ROUTING (Uç Noktalar)
│   ├── orders.routes.js
│   ├── stocks.routes.js
│   ├── machines.routes.js
│   ├── sales.routes.js
│   ├── finance.routes.js
│   ├── dashboard.routes.js
│   ├── charts.routes.js
│   ├── auth.routes.js
│   └── index.js                  # Tüm route'ları birleştirici
│
├── middlewares/                   # MIDDLEWARE
│   ├── loggers/
│   │   └── log.js
│   └── validations/
│       ├── auth.js               # Token doğrulama
│       └── errorHandler.js       # Hata işleme
│
├── utils/                        # UTILITY FONKSİYONLAR
│   ├── error.js                  # Hata sınıfları
│   ├── response.js               # Standart yanıt formatı
│   ├── timestamp.js              # Tarih işlemleri
│   └── erros.js
│
├── validations/                  # DOĞRULAMA
│   └── errorHandler.js
│
└── public/                       # FRONTEND (React + Vite)
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── api/                  # API çağrı fonksiyonları
        ├── components/           # React bileşenleri
        ├── pages/               # Sayfa bileşenleri
        ├── data/                # Mock veriler
        └── utils/               # Yardımcı fonksiyonlar
```

---

## Kurulum Adımları

### 1. Proje Dosyalarını İndir
```bash
git clone https://github.com/username/yesimtekstil.git
cd yesimtekstil
```

### 2. Ortam Değişkenlerini Ayarla
```bash
# .env.example dosyasını .env olarak kopyala
cp .env.example .env

# .env dosyasını düzenle ve veritabanı bilgilerini gir
# NOT: .env dosyası GIT'e yüklenmemelidir (bkz. .gitignore)
```

### 3. Sunucu Bağımlılıklarını Yükle
```bash
npm install
```

### 4. Frontend Bağımlılıklarını Yükle
```bash
cd public
npm install
cd ..
```

### 5. Veritabanını Oluştur
```sql
CREATE DATABASE yesim_tekstil;

-- Tabloları oluşturma scriptleri burada çalıştırılacak
-- (db/schema.sql dosyasında)
```

### 6. Sunucuyu Başlat

**Üretim Modu:**
```bash
npm start
```

**Geliştirme Modu (nodemon ile):**
```bash
npm run dev
```

Sunucu **http://localhost:5001** adresinde çalışacak.

### 7. Frontend'i Başlat (Ayrı Terminal)
```bash
cd public
npm run dev
```

Frontend **http://localhost:5173** adresinde çalışacak (Vite varsayılan).

---

## API Endpoint Listesi

### Base URL
```
http://localhost:5001/api
```

### 1. **Kimlik Doğrulama (Authentication)**
| Method | Endpoint | Açıklama | Durum |
|--------|----------|----------|-------|
| POST | `/auth/register` | Yeni kullanıcı kayıt | ⚠️ Yapılacak |
| POST | `/auth/login` | Giriş yapma | ⚠️ Yapılacak |
| POST | `/auth/logout` | Çıkış yapma | ⚠️ Yapılacak |
| GET | `/auth/profile` | Profil bilgisi alma | ⚠️ Yapılacak |

### 2. **Stok Yönetimi (Stocks)**
| Method | Endpoint | Açıklama | Status |
|--------|----------|----------|--------|
| GET | `/stocks` | Tüm stokları listele | ⚠️ Yapılacak |
| GET | `/stocks/:id` | Belirli stok detayı | ⚠️ Yapılacak |
| POST | `/stocks` | Yeni stok oluştur | ⚠️ Yapılacak |
| PUT | `/stocks/:id` | Stok güncelle | ⚠️ Yapılacak |
| DELETE | `/stocks/:id` | Stok sil | ⚠️ Yapılacak |
| GET | `/stocks/:id/forecast` | Stok tahmini | ⚠️ Yapılacak |

**Stok Oluşturma İsteği (POST /stocks):**
```json
{
  "name": "Pamuk Kumaş",
  "type": "ham_madde",
  "quantity": 1000,
  "unit": "meter",
  "min_quantity": 100,
  "unit_cost": 25.50,
  "supplier_id": 1
}
```

### 3. **Sipariş Yönetimi (Orders)**
| Method | Endpoint | Açıklama | Status |
|--------|----------|----------|--------|
| GET | `/orders` | Tüm siparişleri listele | ⚠️ Yapılacak |
| GET | `/orders/:id` | Sipariş detayı | ⚠️ Yapılacak |
| POST | `/orders` | Yeni sipariş oluştur | ⚠️ Yapılacak |
| PUT | `/orders/:id/status` | Sipariş durumunu güncelle | ⚠️ Yapılacak |
| DELETE | `/orders/:id` | Sipariş iptal et | ⚠️ Yapılacak |
| GET | `/orders/status/late` | Geç kalan siparişler | ⚠️ Yapılacak |

**Sipariş Oluşturma İsteği (POST /orders):**
```json
{
  "customer_id": 5,
  "product_id": 12,
  "quantity": 500,
  "delivery_date": "2026-02-15",
  "notes": "Acil teslim istenmektedir"
}
```

**SENARYO 1 - Hata Örneği (Yetersiz Stok):**
```json
{
  "status": "error",
  "code": 409,
  "message": "Yeterli stok bulunmamaktadır. Mevcut stok: 200 adet, İstenen: 500 adet"
}
```

### 4. **Makine Yönetimi (Machines)**
| Method | Endpoint | Açıklama | Status |
|--------|----------|----------|--------|
| GET | `/machines` | Tüm makineleri listele | ⚠️ Yapılacak |
| GET | `/machines/:id` | Makine detayı | ⚠️ Yapılacak |
| POST | `/machines` | Yeni makine ekle | ⚠️ Yapılacak |
| PUT | `/machines/:id` | Makine güncelle | ⚠️ Yapılacak |
| DELETE | `/machines/:id` | Makine sil | ⚠️ Yapılacak |
| PUT | `/machines/:id/status` | Makine durumunu değiştir | ⚠️ Yapılacak |
| POST | `/machines/:id/maintenance` | Bakım planla | ⚠️ Yapılacak |

**Makine Durumları:** `active`, `maintenance`, `broken`, `idle`

### 5. **Satış Yönetimi (Sales)**
| Method | Endpoint | Açıklama | Status |
|--------|----------|----------|--------|
| GET | `/sales` | Tüm satışları listele | ⚠️ Yapılacak |
| GET | `/sales/:id` | Satış detayı | ⚠️ Yapılacak |
| POST | `/sales` | Yeni satış kaydı | ⚠️ Yapılacak |
| PUT | `/sales/:id` | Satış güncelle | ⚠️ Yapılacak |
| GET | `/sales/report/daily` | Günlük satış raporu | ⚠️ Yapılacak |
| GET | `/sales/report/monthly` | Aylık satış raporu | ⚠️ Yapılacak |

### 6. **Finansal Yönetimi (Finance)**
| Method | Endpoint | Açıklama | Status |
|--------|----------|----------|--------|
| GET | `/finance/summary` | Finansal özet | ⚠️ Yapılacak |
| GET | `/finance/revenue` | Gelir analizi | ⚠️ Yapılacak |
| GET | `/finance/cost` | Maliyet analizi | ⚠️ Yapılacak |
| GET | `/finance/profit` | Kâr analizi | ⚠️ Yapılacak |
| GET | `/finance/forecast` | Mali tahmin | ⚠️ Yapılacak |

### 7. **Dashboard**
| Method | Endpoint | Açıklama | Status |
|--------|----------|----------|--------|
| GET | `/dashboard` | Dashboard verileri | ⚠️ Yapılacak |
| GET | `/dashboard/kpi` | Temel performans göstergeleri | ⚠️ Yapılacak |

### 8. **Grafikler (Charts)**
| Method | Endpoint | Açıklama | Status |
|--------|----------|----------|--------|
| GET | `/charts/sales-trend` | Satış trendi grafiği | ⚠️ Yapılacak |
| GET | `/charts/production-capacity` | Üretim kapasitesi | ⚠️ Yapılacak |
| GET | `/charts/stock-forecast` | Stok tahmini grafiği | ⚠️ Yapılacak |
| GET | `/charts/market-analysis` | Pazar analizi grafiği | ⚠️ Yapılacak |

---

## Yanıt Formatı (Response Format)

### Başarılı İstek
```json
{
  "status": "success",
  "code": 200,
  "message": "Veri başarıyla alındı",
  "data": {
    // API'ye özgü veri
  }
}
```

### Hata Yanıtı
```json
{
  "status": "error",
  "code": 400,
  "message": "Geçersiz istek parametreleri",
  "errors": [
    {
      "field": "email",
      "message": "Geçerli bir e-posta adresi giriniz"
    }
  ]
}
```

### HTTP Durum Kodları
| Kod | Anlam | Örnek |
|-----|-------|-------|
| 200 | OK | Veri başarıyla alındı |
| 201 | Created | Kayıt başarıyla oluşturuldu |
| 400 | Bad Request | Geçersiz parametreler |
| 401 | Unauthorized | Token gerekli / Geçersiz token |
| 403 | Forbidden | Yetki yetersiz |
| 404 | Not Found | Kayıt bulunamadı |
| 409 | Conflict | İş kuralı ihlali (stok yetersiz, vb.) |
| 422 | Unprocessable Entity | İş kuralı ihlali (geçmiş tarih, vb.) |
| 500 | Server Error | Sunucu hatası |

---

## Veritabanı (ER Diyagramı)

### Tablolar

#### **Users** (Kullanıcılar)
```
id (PK) | email | password | name | role | created_at | updated_at
```

#### **Customers** (Müşteriler)
```
id (PK) | name | email | phone | address | created_at | updated_at
```

#### **Products** (Ürünler)
```
id (PK) | name | description | unit | unit_cost | created_at
```

#### **Stocks** (Stoklar)
```
id (PK) | product_id (FK) | quantity | min_quantity | supplier_id | created_at | updated_at
```

#### **Orders** (Siparişler)
```
id (PK) | customer_id (FK) | product_id (FK) | quantity | status | delivery_date | created_at | updated_at
Durumlar: pending, in_production, completed, cancelled
```

#### **Machines** (Makineler)
```
id (PK) | name | type | status | capacity | last_maintenance | created_at
Durumlar: active, maintenance, broken, idle
```

#### **Sales** (Satışlar)
```
id (PK) | order_id (FK) | quantity | unit_price | total_amount | sale_date | created_at
```

#### **Finance** (Finansal Kayıtlar)
```
id (PK) | transaction_type | amount | description | date | created_at
Türleri: revenue, expense, cost
```

---

## Geliştirme Notları

### Teknolojiler
- **Runtime:** Node.js v18+
- **Web Framework:** Express.js
- **Veritabanı:** MySQL 8.0+
- **ORM/Query:** mysql2/promise
- **Validasyon:** Zod
- **Şifreleme:** bcrypt
- **JWT:** jsonwebtoken
- **Frontend:** React 18 + Vite

### Yapılacaklar (TODO)
- [ ] Tüm Controller'lar tamamla
- [ ] Veritabanı bağlantılarını uygula
- [ ] Validasyon kurallarını ekle
- [ ] JWT token doğrulaması
- [ ] API endpoint'lerini test et
- [ ] Frontend sayfa bileşenlerini tamamla
- [ ] ER diyagramını oluştur
- [ ] API dokümantasyonunu (Swagger) ekle
- [ ] Unit testleri yaz

### Debugging
Geliştirme modunda sunucuyu çalıştırır:
```bash
npm run dev
```

Terminal çıktısında hataları görebilirsin.

---

## İletişim & Destek

**Geliştirici:** [Adınız]  
**E-posta:** [Email Adresiniz]  
**GitHub:** https://github.com/username/yesimtekstil

---

## Lisans

Bu proje eğitim amaçlı oluşturulmuştur.

---

**Son Güncelleme:** Ocak 16, 2026
