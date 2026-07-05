# PRD – Türk Trafiği (Web Oyunu)

## Proje Özeti

Tarayıcı üzerinden oynanabilen, mobil ve masaüstü uyumlu, sonsuz (endless runner) tarzında bir araba kaçış oyunu. Oyuncu WASD veya ok tuşları ile aracını kontrol ederek trafikte ilerler ve aniden şerit değiştiren araçlardan kaçmaya çalışır.

Proje githuba push edilerek vercelde yayınlanacak. Bu projede hem next js hem de phaser js kullanılarak geliştirilecek. Reactın sadece ana sayfa, leaderboard ve gameover sayfaları için kullanılacak. Oyun ekranı tamamen phaser js ile geliştirilecek.

---

## Hedef

* Eğlenceli ve hızlı oynanabilen bir web oyunu geliştirmek.
* Vercel üzerinde ücretsiz yayınlamak.
* Liderlik tablosu ile tekrar oynanabilirliği artırmak.

---

## Teknolojiler

* Frontend: Next.js
* Oyun Motoru: Phaser.js
* Veritabanı: Supabase
* Hosting: Vercel

---

## Temel Özellikler

### Oynanış

* WASD ve Ok Tuşları desteği
* 3 veya 4 şeritli yol
* Sonsuz ilerleyen yol
* Rastgele araç üretimi
* Bazı araçlar aniden şerit değiştirebilir.
* Çarpışınca oyun biter.

### Skor Sistemi

* Gidilen mesafe
* Geçilen araç sayısı
* En yüksek skor kaydı
* Global liderlik tablosu

### Zorluk Sistemi

* Süre geçtikçe hız artar.
* Araç yoğunluğu artar.
* Şerit değiştirme sıklığı yükselir.

### Ses ve Efekt

* Motor sesi
* Fren sesi
* Çarpışma efekti
* Arka plan müziği
* Skor artış animasyonları

---

## Oyun Akışı

1. Ana Menü
2. Oyunu Başlat
3. Sonsuz sürüş
4. Engellerden kaç
5. Skor kazan
6. Çarpışma
7. Game Over ekranı
8. Tekrar Oyna

---

## UI

### Ana Menü

* Başlat
* Liderlik Tablosu
* Ayarlar

### Oyun Ekranı

* Skor
* En Yüksek Skor
* Duraklat
* Ses Aç/Kapat

### Game Over

* Son Skor
* Rekor
* Tekrar Oyna
* Ana Menü

---

## Gelecek Sürümler

### v1

* Sonsuz trafik
* Skor sistemi
* Liderlik tablosu

### v2

* Yağmurlu hava
* Gece modu
* Farklı araçlar
* Nitro sistemi

### v3

* Polis kovalamacası
* Yol çalışmaları
* Yakıt sistemi
* Günlük görevler
* Başarım sistemi

---

## Başarı Kriterleri

* 60 FPS akıcı oynanış
* <3 saniye ilk yükleme süresi
* Mobil ve masaüstü uyumluluğu
* Vercel üzerinde sorunsuz yayın
* Supabase ile skorların güvenli şekilde saklanması

---

## MVP

* Araba kontrolü
* Sonsuz yol
* Trafik araçları
* Çarpışma sistemi
* Skor hesaplama
* Game Over ekranı
* Liderlik tablosu
