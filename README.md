# Yeşim Tekstil - Karar Destek Sistemi (DSS)

Bu proje, **Yeşim Tekstil** için geliştirilmiş, üretim, stok takibi, finansal analizler ve geleceğe yönelik tahminlemeler (forecasting) yapan web tabanlı bir **Karar Destek Sistemi'dir (Decision Support System).**

Proje, modern web teknolojileri kullanılarak **MVC (Model-View-Controller)** mimarisine uygun şekilde geliştirilmiştir.

---

##  Proje Özellikleri

* ** Yönetim Paneli (Dashboard):** Kritik KPI'lar, riskli siparişler ve üretim özetleri.
* ** Stok Yönetimi:** Kritik stok seviyeleri, hammadde takibi ve otomatik satın alma önerileri.
* ** Finansal Analiz:** Gelir-Gider takibi, kur (USD/EUR) değişimlerinin maliyete etkisi ve kârlılık analizleri.
* ** tahminleme (Forecasting):** Geçmiş verilere dayanarak gelecek sezon üretim yükü ve kapasite planlama tahminleri.
* **  Yetkilendirme:**  kullanıcı girişi.

---

##  Kullanılan Teknolojiler

### Backend (Sunucu Tarafı)
* **Node.js & Express.js:** Sunucu altyapısı.
* **MySQL:** İlişkisel veritabanı yönetimi.
* **MVC Mimarisi:** Düzenli ve sürdürülebilir kod yapısı.

### Frontend (İstemci Tarafı)
* **React.js:** Kullanıcı arayüzü.
* **Recharts:** Gelişmiş veri görselleştirme ve grafikler.
* **Axios:** API iletişimi.
* **Vite:** Hızlı geliştirme ve derleme aracı.

---

##  Proje Klasör Yapısı (ÖNEMLİ NOT)

Bu proje, sunucu ve istemci taraflarını tek bir çatı altında toplar.

```text
/ (Ana Dizin)
├── app.js                   # Sunucu giriş dosyası
├── db/                      # Veritabanı bağlantı ayarları
├── controllers/             # İş mantığı (Backend fonksiyonları)
├── routers/                 # API yönlendirmeleri
├── middlewares/             # Güvenlik ve kontrol katmanları
│
├── public/                  #  PRODUCTION (CANLI) KODLARI
│   ├── index.html           # Uygulamanın giriş noktası
│   └── assets/              # Sıkıştırılmış (Minified) CSS ve JS dosyaları
│   # NOT: Sunucu çalıştırıldığında bu klasördeki derlenmiş kodlar sunulur.
│
├── frontend_src/            #  KAYNAK (SOURCE) KODLARI
│   ├── src/                 # React bileşenleri, sayfalar ve hook'lar
│   # NOT: Geliştirme yapılan, okunabilir React kodları inceleme için buradadır.
│
└── .env                     # Çevre değişkenleri (Şifreler vb.) ;
