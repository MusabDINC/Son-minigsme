# Proje Tanım Dokümanı (PRD) - İnteraktif 3D Web Deneyimi

## 1. Amaç

Bruno Simon'un açık kaynak kodlu interaktif 3D web deneyimi temel alınarak, kullanıcıların özelleştirilebilir araçlarla etkileşim kurabileceği, uzamsal ses deneyimi yaşayabileceği ve yeni içeriklerin (bina, yol, nesne vb.) eklenebileceği geliştirilebilir bir platform oluşturulacaktır.

## 2. Temel Özellikler ve Görevler

### 2.1 Uzamsal Ses Entegrasyonu
**Amaç:** Kullanıcının etrafındaki ses kaynaklarını yön, uzaklık ve derinlik hissiyle algılayabilmesi.
**Görevler:**
- [x] Web Audio API veya Resonance Audio entegrasyonunu araştır ve uygula.
- [x] bir ses kaynağı oluştur ve uzamsal sesi entegre et arabanın uzaklığına göre ses şiddeti azalsın veya tamamen kapansın.
- [ ] Kullanılacak ses dosyalarını belirle (.ogg/.mp3), optimize et ve projeye ekle.

### 2.2 Araç Değiştirme Sistemi
**Amaç:** Kullanıcının farklı araçlar arasında geçiş yapabilmesi (örneğin: araba, bisiklet, forklift vb.).
**Görevler:**
- [x] Araç varlıklarını (prefab) yönetecek bir `VehicleManager` sınıfı oluştur.
- [ ] Her araç için ayrı fiziksel özellikler (hız, ivme vb.) ve 3D modeller tanımla.
- [x] UI üzerinde araç seçimi için bir dropdown menü veya buton grubu oluştur.
- [x] Klavye kısayolu (örneğin: V tuşu) ile araç değiştirme fonksiyonelliği ekle.
- [x] Araç değiştirildiğinde mevcut aracın sahneden düzgünce kaldırılmasını ve yenisinin yüklenmesini (instantiate) sağla.

### 2.3 Harita Kullanılabilirliği (Navigasyon)
**Amaç:** Kullanıcının harita üzerinde kolayca yön bulması ve etkileşimli öğeleri tanıyabilmesi.
**Görevler:**
- [ ] Mini-map veya tam ekran harita için bir canvas UI bileşeni oluştur.
- [ ] Harita üzerinde önemli noktaları (binalar, görevler vb.) ikonlarla göster.
- [ ] Kullanıcının mevcut konumunu harita üzerinde gösteren bir işaretleyici ("You are here") ekle.
- [ ] Klavye kontrollerini ve harita kullanımını açıklayan bir UI yardım penceresi tasarla ve uygula.

### 2.4 Football Mini Oyunu ve Fizik Sistemleri
**Amaç:** Kullanıcıların araçlarıyla etkileşime girebileceği, futbol oynayarak gol atabilecekleri mini bir oyun yaratmak.
**Görevler:**
- [x] Physics World entegrasyonu ve çarpışma sistemlerinin iyileştirilmesi
- [x] Futbol topu ve fiziksel davranışının implementasyonu
- [x] Kale ve gol algılama sisteminin kurulması
- [x] Skor ve gol animasyonunun eklenmesi
- [x] Futbol sahasının tasarlanması ve görselleştirilmesi
- [x] Bowling labut modelleri yerine gerçek kale.glb modelinin entegrasyonu
- [ ] Oyun başlatma/durdurma mekanizması
- [x] **Kale Modeli Geliştirmeleri:**
    - [x] kale.glb modelini static/models/soccer/ dizinine yerleştirme
    - [x] Kalenin konumunu sahanın kenarına yerleştirme
    - [x] Kale rotasyonunu ve ölçeğini düzenleme
    - [x] Gol algılama için geniş çarpışma alanı (8 birim derinlik) ekleme
    - [x] Gol algılama mantığını iyileştirme ve boyutlarını düzenleme
    - [x] Çarpışma alanı (collider) iyileştirmeleri:
        - [x] Boyutlarını artırma (genişlik: 5.0, derinlik: 10.0, yükseklik: 3.0)
        - [x] Görünürlüğü açık yapma ve opaklığı artırma (0.4)
        - [x] Gol algılama hassasiyetini artırma
    - [x] Kale ve collider konumlandırması:
        - [x] Collider'ı sabit bırakarak kaleyi collider'ın içine yerleştirme
        - [x] Kale boyutunu collider'ın %80'i oranında ayarlama
        - [x] Kaleyi collider içinde Y ekseninde geriye konumlandırma
        - [x] Kale ölçeğini 3.0 olarak ayarlama
        - [x] Gol algılama için collider pozisyon ve boyutlarını kullanma
    - [x] Collider-Kale İlişkisini İyileştirme:
        - [x] Kale ölçeğini 1.2'ye düşürerek collider'a daha iyi oturtma
        - [x] Kaleyi collider'ın alt kısmına yerleştirme (yere oturması için)
        - [x] Kale rotasyonunu topa bakacak şekilde tam olarak ayarlama (Y: 180°)
        - [x] Debug modunda collider sınırlarını sarı renkte gösterme
        - [x] Kale modeli bounding box'ını konsola yazdırarak doğru konumlandırma

### 2.5 Yeni Yapı Ekleme Sistemi
**Amaç:** Platformun ölçeklenebilirliğini sağlamak ve yeni içerik eklemeyi kolaylaştırmak.
**Görevler:**
- [ ] `.blend` veya `.blend1` formatındaki 3D modellerin (yapılar, nesneler) dinamik olarak yüklenebilmesini sağla.
- [ ] Yeni eklenen yapıların metadata'larını (isim, konum, açıklama, etkileşim tipi vb.) tanımlamak için bir JSON yapısı veya benzeri bir konfigürasyon sistemi oluştur.
- [ ] (Opsiyonel) Yapıların dünya içinde konumlandırılması ve yerleştirilmesi için basit bir editör arayüzü veya admin paneli geliştir.

### 2.6 Kamera Açısı Yönetimi
**Amaç:** Kullanıcının oyun deneyimini farklı bakış açılarından yaşayabilmesi.
**Görevler:**
- [] 3. şahıs takip (Third-person follow) kamera modunu uygula.
- [] Serbest dolaşım (Free camera / Spectator) modunu uygula.
- [] FPS (First-person) kamera modunu (araç içinden veya yaya olarak) uygula.
- [] Kullanıcının belirlenen bir tuş (örneğin: C tuşu) ile bu kamera modları arasında geçiş yapmasını sağla.
- [] Her kamera modu için dönüş hızları, sınırlar ve yumuşatma gibi ayarlanabilir parametreler ekle.

## 3. Teknik Altyapı
- **Rendering:** Three.js (Mevcut proje altyapısı)
- **Model Formatları:** `.glb` / `.glb2`
- **Ses:** Web Audio API / Resonance Audio
- **UI:** HTML/CSS + WebGL UI katmanı veya overlay sistemi

---

## #yapılacaklar

*Bu bölüme projenin ilerleyişine göre tamamlanması gereken görevler eklenecektir.*


- [x] **Kale Maç Mekaniği Geliştirme:** (bowling yerine gelecek ) // Yeni oyun mekaniği eklendi
    - [x] **Başlangıç Durumu:** // Topun başlangıç pozisyonu ve araç etkileşimi
        - [x] Topu kaleye belirli bir mesafede (ör: 5 birim) sabitle.
        - [x] Aracın topu fiziksel temasla itebilmesini sağla.
    - [x] **Gol Algılama:** // Gol olduğunda gerçekleşecek olaylar 
        - [x] Top kale çizgisindeki trigger alanına girdiğinde golü algıla.
        - [x] Ekranda "GOLLL!" yazısını göster (Opsiyonel: 3-4 saniye).
    - [x] **Reset Mekanizması:** // Oyun durumunu sıfırlama
        - [x] Buton etkileşimi ile topu orijinal konumuna ışınla.
    - [x] **Bowling Yerine Entegrasyon:** // Bowling oyununu futbol oyununa dönüştürme
        - [x] Bowling pinlerini kaldırıp kale oluşturma.
        - [x] Bowling topunu futbol topu olarak kullanma.
        - [x] Gol algılama ve score sistemi ekleme.
- [x] **Roket Geliştirme ve İyileştirme:**
    - [x] Model kaynağını Resources.js'de base.gltf olarak ayarlama
    - [x] İki kez iniş yapma sorununu çözme ve roketin koyu yeşil alanın ortasına taşınması
    - [x] Modelin mesh'lerini (shadeGray, shadeWhite, shadeRed) tanımlama ve doğru renkleri atama
    - [x] Roketin zeminden yükseltilerek doğru pozisyonlandırılması (0.5 birim)
    - [x] Renkleri daha parlak ve canlı hale getirme:
        - [x] Gri parçalar için 0xaaaaaa (daha açık gri) kullanma
        - [x] Beyaz parçalar için daha parlak beyaz ve güçlü ışıma ayarları
        - [x] Kırmızı parçalar için 0xff5555 (canlı kırmızı) ve güçlü ışıma (emissiveIntensity: 2.0)
    - [x] Roketi aydınlatmak için özel spot ışık ekleme (2.5 yoğunlukta, 10 birim yükseklikte)
    - [x] Yedek modelin renklerini benzer parlaklık değerleri ile güncelleme
    - [x] Roketin rotasyonunu düzelterek dik durmasının sağlanması
    - [x] Shader ayarlarını optimize etme:
        - [x] Tüm renk değerlerini daha parlak hale getirme (Gri: 0xcccccc, Kırmızı: 0xff3333)
        - [x] Roughness değerlerini daha da düşürme (0.03-0.05) 
        - [x] EmissiveIntensity değerlerini artırma (2.0-3.0)
        - [x] Ana spot ışık yoğunluğunu 4.0'a çıkarma ve açısını genişletme
        - [x] Yan taraftan aydınlatma için ikinci bir ışık ekleme
        - [x] Genel bir ambiyans ışığı ekleme (0x404040, 1.5 yoğunlukta)
    - [x] İniş animasyonunu iyileştirme:
        - [x] İki kez iniş yapma sorununu tamamen giderme 
        - [x] Tek seferde dikey iniş algoritması oluşturma
        - [x] Daha düzgün ve kesintisiz bir iniş animasyonu sağlama
    - [x] Kalkış animasyonunu iyileştirme:
        - [x] İleri gidiş hareketini kaldırarak tam dikey kalkış sağlama
        - [x] Roketin her zaman dik pozisyonda kalmasını garantileme



