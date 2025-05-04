import * as THREE from 'three'
import CANNON from 'cannon'
import { gsap } from 'gsap'

export class Rocket {
    constructor(_options) {
        // Seçenekler
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug
        this.sounds = _options.sounds
        this.position = _options.position || new THREE.Vector3(0, 0, 0)

        // Kurulum
        this.container = new THREE.Object3D()
        this.container.position.copy(this.position)
        
        // Roketi zemin üzerine yükselt
        this.container.position.z = 0.5
        
        // İniş durumu takibi için
        this.isLaunched = false
        this.isLanding = false

        this.setModels()
        this.setLight()
        this.setAnimation()
        this.setPhysics()
        this.setTriggers()
        
        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('rocket')
            this.debugFolder.add(this, 'launch').name('Roketi Fırlat')
            this.debugFolder.add(this.container.position, 'x').step(0.1).name('x')
            this.debugFolder.add(this.container.position, 'y').step(0.1).name('y')
            this.debugFolder.add(this.container.position, 'z').step(0.1).name('z')
        }
    }

    setModels() {
        // Model oluşturma
        this.model = {}
        
        // Yedek roket oluşturma fonksiyonu
        const createBackupModel = () => {
            console.log('Roket modeli yüklenemedi, yedek model oluşturuluyor...')
            
            // Ana gövde - Silindir
            const geometry = new THREE.CylinderGeometry(0.5, 0.8, 4, 16)
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xcccccc,  // Daha açık gri
                metalness: 0.9, 
                roughness: 0.05, // Daha parlak
                emissive: 0x666666,
                emissiveIntensity: 2.0 // Daha güçlü ışıma
            })
            this.model.mesh = new THREE.Mesh(geometry, material)
            
            // Roket ucu - Koni
            const tipGeometry = new THREE.ConeGeometry(0.5, 1, 16)
            const tipMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffffff,   // Parlak beyaz
                metalness: 0.7, 
                roughness: 0.03, // Daha parlak
                emissive: 0xaaaaaa,
                emissiveIntensity: 2.5 // Daha güçlü ışıma
            })
            const tip = new THREE.Mesh(tipGeometry, tipMaterial)
            tip.position.y = 2.5
            this.model.mesh.add(tip)
            
            // Kanatlar
            const wingGeometry = new THREE.BoxGeometry(0.1, 1, 0.5)
            const wingMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff3333,  // Canlı kırmızı
                metalness: 0.6, 
                roughness: 0.05, // Daha parlak
                emissive: 0xcc2222,
                emissiveIntensity: 3.0 // Daha güçlü ışıma
            })
            
            // 4 kanat ekle
            for (let i = 0; i < 4; i++) {
                const wing = new THREE.Mesh(wingGeometry, wingMaterial)
                wing.position.set(
                    Math.sin(i * Math.PI / 2) * 0.8,
                    -1.5,
                    Math.cos(i * Math.PI / 2) * 0.8
                )
                wing.rotation.y = i * Math.PI / 2
                this.model.mesh.add(wing)
            }
            
            // Roket altı ateş efekti - daha güçlü
            const fireGeometry = new THREE.ConeGeometry(0.5, 1.5, 16)
            const fireMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xffcc00, // Daha parlak sarı
                emissive: 0xff8800, // Daha parlak turuncu
                emissiveIntensity: 3.0, // Daha güçlü ışıma
                transparent: true,
                opacity: 0.9
            })
            
            const fire = new THREE.Mesh(fireGeometry, fireMaterial)
            fire.position.y = -2.5
            fire.rotation.x = Math.PI
            this.model.mesh.add(fire)
            
            // Roket modelini dikey konuma getir
            this.model.mesh.rotation.x = Math.PI / 2  // 90 derece yatırma
            
            // Roket modelini büyüt
            this.model.mesh.scale.set(2.0, 2.0, 2.0)
        }
        
        try {
            // GLTF roket modelini kullanmayı dene
            if (this.resources.items.rocketModel) {
                this.model.mesh = this.resources.items.rocketModel.scene.clone()
                
                // Modeli ölçeklendir ve ayarla
                this.model.mesh.scale.set(1.2, 1.2, 1.2)  
                
                // Rotasyonu ve pozisyonu ayarla - dik duracak şekilde
                this.model.mesh.rotation.x = 0  // model doğal olarak dik
                this.model.mesh.rotation.y = 0
                this.model.mesh.rotation.z = 0
                this.model.mesh.position.y = 0
                
                // base.gltf dosyasındaki mesh isimlerine göre renkleri ayarla
                this.model.mesh.traverse((child) => {
                    if (child.isMesh) {
                        // Mesh adına göre yeni materyal oluştur ve uygula
                        if (child.name.includes('shadeGray')) {
                            // Gri parçalar - daha açık ve parlak
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xcccccc, // Daha açık gri
                                emissive: 0x666666, // Daha güçlü ışıma
                                metalness: 0.9,
                                roughness: 0.05, // Çok daha parlak
                                emissiveIntensity: 2.0 // Çok daha güçlü ışıma
                            });
                            console.log('Gri parça rengi uygulandı:', child.name);
                        } 
                        else if (child.name.includes('shadeWhite')) {
                            // Beyaz parçalar - çok daha parlak
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xffffff,
                                emissive: 0xaaaaaa, // Çok daha güçlü beyaz ışıma
                                metalness: 0.7,
                                roughness: 0.03, // Çok daha parlak
                                emissiveIntensity: 2.5 // Çok daha güçlü ışıma
                            });
                            console.log('Beyaz parça rengi uygulandı:', child.name);
                        }
                        else if (child.name.includes('shadeRed')) {
                            // Kırmızı parçalar - çok daha canlı ve parlak
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xff3333, // Daha canlı kırmızı
                                emissive: 0xcc2222, // Daha güçlü kırmızı ışıma
                                metalness: 0.6,
                                roughness: 0.05, // Çok daha parlak
                                emissiveIntensity: 3.0 // Çok daha güçlü ışıma
                            });
                            console.log('Kırmızı parça rengi uygulandı:', child.name);
                        }
                    }
                });
            } else {
                // Model yüklenemezse yedek model oluştur
                createBackupModel()
            }
        } catch (error) {
            console.error('Roket modeli yüklenirken hata:', error)
            // Hata durumunda yedek model oluştur
            createBackupModel()
        }
        
        // Dumanlar için grup
        this.smoke = new THREE.Group()
        
        // Duman parçacıkları için malzeme
        const textureLoader = new THREE.TextureLoader()
        
        // Duman texture'ı oluşturmak için canvas kullan
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const context = canvas.getContext('2d')
        
        // Beyaz yuvarlak bir gradient çiz
        const gradient = context.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            0,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width / 2
        )
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        gradient.addColorStop(0.5, 'rgba(240, 240, 240, 0.5)')
        gradient.addColorStop(1, 'rgba(220, 220, 220, 0)')
        
        context.fillStyle = gradient
        context.fillRect(0, 0, canvas.width, canvas.height)
        
        const smokeTexture = new THREE.CanvasTexture(canvas)
        
        // Duman parçacıkları oluştur
        for(let i = 0; i < 20; i++) {
            const smokeSprite = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: smokeTexture,
                    transparent: true,
                    opacity: 0.6,
                    color: 0xcccccc
                })
            )
            smokeSprite.scale.set(0.15, 0.15, 0.15)
            smokeSprite.position.set(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                -0.2 - Math.random() * 0.5
            )
            smokeSprite.visible = false
            this.smoke.add(smokeSprite)
        }
        
        // Roketi ve dumanı container'a ekle
        this.container.add(this.model.mesh)
        this.container.add(this.smoke)
    }

    setLight() {
        // Roketi aydınlatacak bir spot ışık oluştur
        this.light = new THREE.SpotLight(0xffffff, 4.0) // Daha parlak beyaz ışık
        this.light.position.set(0, 0, 10) // Roketin 10 birim üzerinde
        this.light.target = this.container // Roketi hedefle
        this.light.angle = Math.PI / 3 // Daha geniş ışık açısı
        this.light.penumbra = 0.3 // Daha yumuşak kenar geçişi
        this.light.decay = 1.0 // Daha az ışık azalması
        this.light.distance = 35 // Daha uzun ışık mesafesi
        this.light.castShadow = true // Gölge oluştur
        
        // İkinci bir ışık ekle - yan taraftan aydınlatma
        this.secondLight = new THREE.PointLight(0xffffee, 2.0, 15)
        this.secondLight.position.set(3, 3, 5)
        this.container.add(this.secondLight)
        
        // Genel ortam ışığı ekle
        this.ambientLight = new THREE.AmbientLight(0x404040, 1.5)
        this.container.add(this.ambientLight)
        
        // Işığı container'a ekle
        this.container.add(this.light)
        
        // Gölge kalitesi ayarları
        this.light.shadow.mapSize.width = 512
        this.light.shadow.mapSize.height = 512
        this.light.shadow.camera.near = 0.5
        this.light.shadow.camera.far = 35
        
        // Işık için yardımcı gösterge (debug için)
        if (this.debug) {
            const lightHelper = new THREE.SpotLightHelper(this.light)
            this.container.add(lightHelper)
        }
    }

    setAnimation() {
        // Animasyon durumu
        this.animation = {
            enabled: false,
            state: 'idle', // 'idle', 'preparing', 'launching', 'flying', 'returning'
            launchProgress: 0,
            flightTime: 0,
            flightPath: {
                maxHeight: 25,           // Maksimum yükseklik
                maxDistance: 15,         // Maksimum ileri mesafe
                circleRadius: 8,         // Dönüş yarıçapı
                returnDelay: 5000,       // Dönüş başlamasından önceki gecikme
                totalFlightTime: 15000,  // Toplam uçuş süresi
            }
        }
        
        // Başlangıç pozisyonunu kaydet
        this.startPosition = this.container.position.clone()
        
        // Roket doğru rotasyonda olsun
        this.container.rotation.set(0, 0, 0)
        
        // Zaman kontrolü
        this.time.on('tick', () => {
            // Roket ateşlenmişse
            if(this.animation.state === 'launching' || this.animation.state === 'flying' || this.animation.state === 'returning') {
                // Duman parçacıklarını güncelle
                for(let i = 0; i < this.smoke.children.length; i++) {
                    const smokeParticle = this.smoke.children[i]
                    
                    if(!smokeParticle.visible) {
                        smokeParticle.visible = true
                        smokeParticle.scale.set(0.1, 0.1, 0.1)
                        smokeParticle.material.opacity = 0.6
                        smokeParticle.position.z = -0.5 - Math.random() * 0.5
                        smokeParticle.position.x = (Math.random() - 0.5) * 0.8
                        smokeParticle.position.y = (Math.random() - 0.5) * 0.8
                    }
                    
                    // Duman parçacıklarını hareket ettir ve büyüt
                    smokeParticle.position.z -= 0.1 * this.time.delta
                    smokeParticle.scale.x += 0.01 * this.time.delta
                    smokeParticle.scale.y += 0.01 * this.time.delta
                    smokeParticle.material.opacity -= 0.01 * this.time.delta
                    
                    // Parçacık çok uzağa gitmişse veya şeffaflaşmışsa sıfırla
                    if(smokeParticle.position.z < -5 || smokeParticle.material.opacity <= 0) {
                        smokeParticle.visible = false
                    }
                }
                
                // Roket uçuş hareketi
                if(this.animation.state === 'flying' || this.animation.state === 'returning') {
                    // Zamanı güncelle
                    this.animation.flightTime += this.time.delta;
                    
                    // Uçuş durumuna göre hareketi güncelle
                    if(this.animation.state === 'flying') {
                        // Yükseklik hareketi - parabolik yükselme
                        const normalizedTime = Math.min(this.animation.flightTime / 5000, 1); // 5 saniyede maksimum yüksekliğe
                        
                        // Yukarı doğru hareket
                        const height = this.animation.flightPath.maxHeight * Math.sin(normalizedTime * Math.PI * 0.5);
                        this.container.position.z = this.startPosition.z + height;
                        
                        // Dik duruşu koru
                        this.container.rotation.set(0, 0, 0);
                        
                        // Dönüş zamanı geldi mi?
                        if(this.animation.flightTime > this.animation.flightPath.returnDelay) {
                            this.animation.state = 'returning';
                            this.animation.flightTime = 0; // Zamanı sıfırla
                            this.isLanding = true; // İniş durumunu aktifleştir
                            
                            // Uçuş başarılı mesajı
                            console.log('Roket dönüş yörüngesine girdi!');
                        }
                    } else if(this.animation.state === 'returning' && this.isLanding) {
                        // Tek seferde dikey iniş için yeniden düzenlendi
                        const normalizedTime = Math.min(this.animation.flightTime / (this.animation.flightPath.totalFlightTime * 0.5), 1);
                        
                        // Başlangıç noktasını hedefle (x ve y sabit)
                        const x = this.startPosition.x;
                        const y = this.startPosition.y;
                        
                        // Yüksekliği kademeli olarak azalt
                        const height = this.animation.flightPath.maxHeight * (1 - normalizedTime);
                        
                        // Pozisyonu güncelle - direk olarak başlangıç noktasına doğru git
                        this.container.position.set(x, y, this.startPosition.z + height);
                        
                        // Dik konumu her zaman koru
                        this.container.rotation.set(0, 0, 0);
                        
                        // İniş tamamlandı mı?
                        if (normalizedTime >= 0.99) {
                            this.animation.state = 'idle';
                            this.isLaunched = false;
                            this.isLanding = false; // İniş durumunu sıfırla
                            this.animation.flightTime = 0;
                            
                            // Final iniş animasyonu - doğrudan iniş yerine geri dön
                            gsap.to(this.container.position, {
                                x: this.startPosition.x,
                                y: this.startPosition.y,
                                z: this.startPosition.z,
                                duration: 0.3,
                                ease: "power1.out",
                                onComplete: () => {
                                    // Fizik gövdesini güncelle
                                    if(this.physics.body) {
                                        this.physics.body.position.copy(this.container.position);
                                        this.physics.body.quaternion.copy(this.container.quaternion);
                                        this.physics.body.sleep();
                                    }
                                    
                                    console.log('Roket başlangıç konumunda hazır!');
                                }
                            });
                        }
                    }
                    
                    // Fiziksel roket gövdesini de güncelle
                    if(this.physics.body) {
                        this.physics.body.position.copy(this.container.position);
                        this.physics.body.quaternion.copy(this.container.quaternion);
                        this.physics.body.wakeUp();
                    }
                }
            }
        })
    }

    setPhysics() {
        // Fizik ayarları
        this.physics.body = new CANNON.Body({
            mass: 100,
            position: new CANNON.Vec3(
                this.container.position.x,
                this.container.position.y,
                this.container.position.z
            ),
            shape: new CANNON.Box(new CANNON.Vec3(0.4, 0.4, 0.9)),
            material: this.physics.materials.items.dummy
        })
        
        // Dünya fiziğine ekle
        this.physics.world.addBody(this.physics.body)
        
        // Başlangıçta uyku modunda
        this.physics.body.sleep()
    }

    setTriggers() {
        // Roket fırlatma yöntemleri
        this.movementSpeed = 0
        
        // K tuşuna basma dinleyicisi ekle
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'k') {
                if (!this.isLaunched) {
                    console.log('K tuşu ile roket fırlatıldı!')
                    this.launch()
                } else {
                    console.log('Roket zaten fırlatılmış durumda!')
                }
            }
        })
    }

    launch() {
        if(this.isLaunched) return
        
        this.isLaunched = true
        this.animation.state = 'preparing'
        
        // Başlangıç pozisyonunu tekrar kaydet
        this.startPosition = this.container.position.clone()
        
        // Roketin hazırlanması için titreşim animasyonu
        const shakeTl = gsap.timeline({
            onComplete: () => this.startLaunch()
        })
        
        // Titreşim animasyonu - daha küçük titreşimler
        for(let i = 0; i < 10; i++) {
            shakeTl.to(this.container.position, {
                x: this.startPosition.x + (Math.random() - 0.5) * 0.1,
                y: this.startPosition.y + (Math.random() - 0.5) * 0.1,
                duration: 0.08
            })
        }
        
        // Ses efekti çal
        if(this.sounds) {
            // Gerçek ses dosyası yoksa konsola bilgi yazdırıyoruz
            console.log('Roket motorları hazırlanıyor...')
        }
    }
    
    startLaunch() {
        this.animation.state = 'launching'
        
        // Roket ateşini görünür hale getir (modelde özel bir ateş mesh'i yoksa, yedek modelde olabilir)
        if (this.model.mesh) {
            this.model.mesh.traverse((child) => {
                // Ateş efekti olarak adlandırılan veya ismi "fire" içeren mesh'i bul
                if (child.name && (child.name.includes('fire') || child.name.includes('Fire'))) {
                    // Varsa ateş efektini görünür yap
                    child.visible = true
                    // Parlama efekti için emissive değerini artır
                    if (child.material) {
                        child.material.emissiveIntensity = 2.0
                    }
                }
            })
        }
        
        // Roketin kalkışı için animasyon - daha fazla yükselme
        gsap.to(this.container.position, {
            z: this.container.position.z + 0.8, // Daha yükseğe çıksın
            duration: 1.5,
            ease: "power2.in",
            onComplete: () => this.startFlying()
        })
        
        // Fizik motorunu aktifleştir
        this.physics.body.wakeUp()
        
        // Ses efekti çal
        if(this.sounds) {
            // Gerçek ses dosyası yoksa konsola bilgi yazdırıyoruz
            console.log('Roket fırlatıldı! Motorlar tam güçte çalışıyor...')
        }
    }
    
    startFlying() {
        this.animation.state = 'flying'
        this.animation.flightTime = 0
        
        // İniş durumunu sıfırla
        this.isLanding = false
        
        // Duman parçacıklarını daha görünür yap
        this.smoke.children.forEach(smokeParticle => {
            smokeParticle.material.opacity = 0.9 // Dumanı daha opak yap
            smokeParticle.scale.set(0.2, 0.2, 0.2) // Duman parçacıklarını büyüt
        })
        
        // Sese efekti güçlendir
        if(this.sounds) {
            // Gerçek ses dosyası yoksa konsola bilgi yazdırıyoruz
            console.log('Roket yükseliyor! Ses bariyeri aşıldı!')
        }
    }
} 