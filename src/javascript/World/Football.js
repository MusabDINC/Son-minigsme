import * as THREE from 'three'
import CANNON from 'cannon'

export default class Football
{
    constructor(_options)
    {
        // Seçenekler
        this.debug = _options.debug
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.ui = _options.ui
        this.time = _options.time
        this.sounds = _options.sounds
        this.areas = _options.areas

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        
        // Optimizasyon - başlangıçta sadece modelleri tanımla, diğer nesneleri lazım olduğunda oluştur
        this.initialized = false
        this.setModels()
    }
    
    // Oyun nesnelerini oluşturmak için lazım olduğunda çağrılacak
    initialize() {
        if (this.initialized) return;
        
        this.setGoal()
        this.setBall()
        this.setGUI()
        this.setResetButton()
        this.checkInteractions()
        
        this.initialized = true
        console.log('Football mini oyunu başlatıldı')
    }

    /**
     * Model ve fizik nesnelerini ayarla
     */
    setModels()
    {
        this.models = {}

        // Futbol topu
        this.models.ball = {}
        this.models.ball.offset = new THREE.Vector3(0, 0, 0.2) // Topun yerden yüksekliği
        this.models.ball.radius = 0.2 // Top yarıçapı
        this.models.ball.position = new THREE.Vector3(0, 0, 0) // Başlangıç pozisyonu - daha sonra güncellenecek

        // Kale boyutları - kale.glb modeline uygun olarak güncellenmiş
        this.models.goal = {}
        this.models.goal.size = new THREE.Vector3(2.0, 0.8, 1.2) // genişlik, derinlik, yükseklik
        this.models.goal.position = new THREE.Vector3(5, 0, 0) // Kale pozisyonu

        // Topun başlangıç pozisyonu - kaleden belirli bir mesafede
        this.models.ball.initialPosition = new THREE.Vector3(
            this.models.goal.position.x - 5, // Kaleden 5 birim uzakta
            this.models.goal.position.y,
            this.models.ball.offset.z
        )
        this.models.ball.position.copy(this.models.ball.initialPosition)

        // Gol algılama için trigger alanı
        this.models.goalTrigger = {}
        this.models.goalTrigger.size = new THREE.Vector3(0.2, this.models.goal.size.y, this.models.goal.size.z)
        this.models.goalTrigger.position = new THREE.Vector3(
            this.models.goal.position.x + this.models.goal.size.x / 2 - this.models.goalTrigger.size.x / 2,
            this.models.goal.position.y,
            this.models.goal.position.z + this.models.goal.size.z / 2
        )
    }

    /**
     * Kaleyi oluştur (optimize edilmiş)
     */
    setGoal()
    {
        try {
            this.goal = {}

            // Fizik gövdesi
            this.goal.body = new CANNON.Body({
                mass: 0, // Statik gövde
                material: this.physics.materials.items.dummy
            })

            // Kale çerçevesi için fizik şekilleri (daha az şekil)
            const frameShape = new CANNON.Box(new CANNON.Vec3(
                this.models.goal.size.x / 2,
                this.models.goal.size.y / 2,
                this.models.goal.size.z / 2
            ))

            // Fizik şeklini pozisyonlandır ve gövdeye ekle
            this.goal.body.addShape(
                frameShape,
                new CANNON.Vec3(
                    this.models.goal.position.x,
                    this.models.goal.position.y,
                    this.models.goal.position.z + this.models.goal.size.z / 2
                )
            )

            // Fizik dünyasına ekle
            this.physics.world.addBody(this.goal.body)

            // Görsel model - kale.glb modeli kullan
            this.goal.container = new THREE.Object3D()
            this.goal.container.position.copy(this.models.goal.position)

            // kale.glb modelini yükle
            if (this.resources.items.kaleModel) {
                // Model varsa kullan
                console.log('Kale modeli bulundu, yükleniyor...')
                
                // GLTFLoader ile yüklenen model doğrudan kullanılabilir
                this.goal.model = new THREE.Object3D()
                
                // Kale modelini kopyala
                const kaleModel = this.resources.items.kaleModel.scene.clone()
                
                // Kale modelini ölçeklendir (boyutu ayarla)
                kaleModel.scale.set(2.0, 2.0, 2.0)
                
                // Modeli döndür (kale modeli doğru yöne baksın)
                kaleModel.rotation.x = Math.PI / 2
                
                // Pozisyonu ayarla - tam olarak doğru konumda olması için
                kaleModel.position.set(0, 0, 0.5)
                
                // Kale modelinin tüm çocuk mesh'lerini döngü ile gezelim
                kaleModel.traverse((child) => {
                    if (child.isMesh) {
                        console.log('Kale mesh bulundu:', child.name)
                        
                        // Mesh'lere parlak beyaz materyal uygula
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0.3,
                            roughness: 0.2,
                            emissive: 0x222222,
                            emissiveIntensity: 0.5
                        });
                        
                        // Gölgeleri etkinleştir
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Modeli container'a ekle
                this.goal.model.add(kaleModel)
                this.goal.container.add(this.goal.model)
                console.log('Kale modeli başarıyla yüklendi')
            } else {
                console.warn('Kale modeli bulunamadı, basit kale kullanılıyor')
                
                // Basit bir kale oluştur
                const goalMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xffffff,
                    metalness: 0.3,
                    roughness: 0.2
                })

                // U şeklinde kale oluştur
                const postSize = { width: 0.1, height: 1.2 };
                const crossbarSize = { width: 2.0, height: 0.1 };

                // Sol direk
                const leftPost = new THREE.Mesh(
                    new THREE.BoxGeometry(postSize.width, postSize.height, postSize.width),
                    goalMaterial
                );
                leftPost.position.set(-crossbarSize.width/2 + postSize.width/2, 0, postSize.height/2);
                
                // Sağ direk
                const rightPost = new THREE.Mesh(
                    new THREE.BoxGeometry(postSize.width, postSize.height, postSize.width),
                    goalMaterial
                );
                rightPost.position.set(crossbarSize.width/2 - postSize.width/2, 0, postSize.height/2);
                
                // Üst direk
                const crossbar = new THREE.Mesh(
                    new THREE.BoxGeometry(crossbarSize.width, postSize.width, postSize.width),
                    goalMaterial
                );
                crossbar.position.set(0, 0, postSize.height);
                
                // Direkleri container'a ekle
                this.goal.container.add(leftPost);
                this.goal.container.add(rightPost);
                this.goal.container.add(crossbar);
            }

            // Container'a ekle
            this.container.add(this.goal.container)

            // Gol algılama için trigger alanı
            this.goal.trigger = {}
            this.goal.trigger.shape = new CANNON.Box(
                new CANNON.Vec3(
                    this.models.goalTrigger.size.x / 2,
                    this.models.goalTrigger.size.y / 2,
                    this.models.goalTrigger.size.z / 2
                )
            )
            this.goal.trigger.body = new CANNON.Body({
                mass: 0,
                isTrigger: true
            })
            this.goal.trigger.body.addShape(this.goal.trigger.shape)
            this.goal.trigger.body.position.set(
                this.models.goalTrigger.position.x,
                this.models.goalTrigger.position.y,
                this.models.goalTrigger.position.z
            )
            this.physics.world.addBody(this.goal.trigger.body)

            // Debug için trigger görselleştirme
            if (this.debug) {
                const triggerGeometry = new THREE.BoxGeometry(
                    this.models.goalTrigger.size.x,
                    this.models.goalTrigger.size.y,
                    this.models.goalTrigger.size.z
                )
                const triggerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff0000,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5
                })
                this.goal.trigger.mesh = new THREE.Mesh(triggerGeometry, triggerMaterial)
                this.goal.trigger.mesh.position.copy(this.models.goalTrigger.position)
                this.container.add(this.goal.trigger.mesh)
            }
        } catch (error) {
            console.error('Kale oluşturulamadı:', error)
        }
    }

    /**
     * Futbol topunu oluştur (optimize edilmiş)
     */
    setBall()
    {
        try {
            this.ball = {}

            // Fizik gövdesi
            this.ball.body = new CANNON.Body({
                mass: 1,
                position: new CANNON.Vec3(
                    this.models.ball.initialPosition.x,
                    this.models.ball.initialPosition.y,
                    this.models.ball.initialPosition.z
                ),
                shape: new CANNON.Sphere(this.models.ball.radius),
                material: this.physics.materials.items.dummy,
                linearDamping: 0.5,
                angularDamping: 0.5
            })
            this.physics.world.addBody(this.ball.body)

            // Görsel model - basitleştirilmiş top
            const ballGeometry = new THREE.SphereGeometry(this.models.ball.radius, 16, 16)
            const ballMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xffffff,
                wireframe: false
            })
            
            this.ball.mesh = new THREE.Mesh(ballGeometry, ballMaterial)
            this.container.add(this.ball.mesh)

            // Top-zemin etkileşimi
            const ballGroundContact = new CANNON.ContactMaterial(
                this.physics.materials.items.floor,
                this.physics.materials.items.dummy,
                {
                    friction: 0.3,
                    restitution: 0.4
                }
            )
            this.physics.world.addContactMaterial(ballGroundContact)

            // Top-araç etkileşimi
            const ballVehicleContact = new CANNON.ContactMaterial(
                this.physics.materials.items.wheel,
                this.physics.materials.items.dummy,
                {
                    friction: 0.3,
                    restitution: 0.2
                }
            )
            this.physics.world.addContactMaterial(ballVehicleContact)

            // Her karede topun pozisyonunu güncelle
            this.time.on('tick', () => {
                if (this.ball && this.ball.mesh && this.ball.body) {
                    this.ball.mesh.position.copy(this.ball.body.position)
                    this.ball.mesh.quaternion.copy(this.ball.body.quaternion)
                }
            })
        } catch (error) {
            console.error('Top oluşturulamadı:', error)
        }
    }

    /**
     * UI ve gol mesajını ayarla (basitleştirilmiş)
     */
    setGUI()
    {
        try {
            this.gui = {}
            
            // Gol mesajı - basit stil
            this.gui.goalMessage = document.createElement('div')
            this.gui.goalMessage.className = 'goal-message'
            this.gui.goalMessage.style.position = 'absolute'
            this.gui.goalMessage.style.top = '50%'
            this.gui.goalMessage.style.left = '50%'
            this.gui.goalMessage.style.transform = 'translate(-50%, -50%)'
            this.gui.goalMessage.style.color = '#ff0000'
            this.gui.goalMessage.style.fontSize = '48px'
            this.gui.goalMessage.style.fontWeight = 'bold'
            this.gui.goalMessage.style.display = 'none'
            this.gui.goalMessage.style.zIndex = '1000'
            this.gui.goalMessage.textContent = 'GOLLL!'
            
            document.body.appendChild(this.gui.goalMessage)

            // Gol durumunu takip et
            this.hasScored = false
        } catch (error) {
            console.error('GUI oluşturulamadı:', error)
        }
    }

    /**
     * Reset butonunu oluştur (basitleştirilmiş)
     */
    setResetButton()
    {
        try {
            // Reset butonu için bir alan oluştur
            this.resetArea = this.areas.add({
                position: new THREE.Vector2(
                    this.models.ball.initialPosition.x - 1,
                    this.models.ball.initialPosition.y
                ),
                halfExtents: new THREE.Vector2(0.5, 0.5),
                debug: this.debug ? { color: 0x00ff00 } : false,
                text: {
                    value: 'SIFIRLA',
                    position: new THREE.Vector2(0, 0),
                    size: 0.5
                }
            })

            // Reset fonksiyonu
            this.resetArea.on('interact', () => {
                this.resetBall()
            })
        } catch (error) {
            console.error('Reset butonu oluşturulamadı:', error)
        }
    }

    /**
     * Topu başlangıç pozisyonuna geri döndür
     */
    resetBall()
    {
        try {
            // Topun fizik gövdesini sıfırla
            if (this.ball && this.ball.body) {
                this.ball.body.position.copy(this.models.ball.initialPosition)
                this.ball.body.velocity.set(0, 0, 0)
                this.ball.body.angularVelocity.set(0, 0, 0)
                this.ball.body.wakeUp()
            }

            // Gol durumunu sıfırla
            this.hasScored = false
            
            // Gol mesajını gizle
            if (this.gui && this.gui.goalMessage) {
                this.gui.goalMessage.style.display = 'none'
            }
        } catch (error) {
            console.error('Top sıfırlanamadı:', error)
        }
    }

    /**
     * Etkileşimleri kontrol et (gol)
     */
    checkInteractions()
    {
        try {
            // Top ve gol triggeri arasındaki etkileşimi kontrol et
            if (this.goal && this.goal.trigger && this.goal.trigger.body) {
                this.goal.trigger.body.addEventListener('collide', (event) => {
                    // Eğer çarpışan nesne topsa
                    if (event.body === this.ball.body && !this.hasScored) {
                        // Gol oldu!
                        this.hasScored = true
                        
                        // Gol mesajını göster - basitleştirilmiş
                        if (this.gui && this.gui.goalMessage) {
                            this.gui.goalMessage.style.display = 'block'
                        }
                        
                        // Ses efekti
                        if (this.sounds) {
                            this.sounds.play('carHit', 3)
                        }
                        
                        // 3 saniye sonra mesajı gizle
                        setTimeout(() => {
                            if (this.gui && this.gui.goalMessage) {
                                this.gui.goalMessage.style.display = 'none'
                            }
                        }, 3000)
                    }
                })
            }
        } catch (error) {
            console.error('Etkileşim kontrolü kurulamadı:', error)
        }
    }
} 