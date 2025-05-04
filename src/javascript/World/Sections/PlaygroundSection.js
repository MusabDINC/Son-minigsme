import * as THREE from 'three'
import CANNON from 'cannon'
import { Howl, Howler } from 'howler'

export default class PlaygroundSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.walls = _options.walls
        this.tiles = _options.tiles
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y
        this.sounds = _options.sounds

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('playgroundSection')
            this.debugFolder.open()
            this.debugFolder.add(this, 'setFootballField').name('setFootballField')
            this.debugFolder.add(this, 'setBowling').name('setBowling')
            
            // Kale ayarlarını tutacak değişkenler
            this.kaleSettings = {
                scale: 1.2,
                rotationX: Math.PI / 2,
                rotationY: Math.PI,
                positionX: 0,
                positionY: 0,
                positionZ: -1.5
            }
            
            // Kale ayarları için klasör oluştur
            this.kaleFolder = this.debugFolder.addFolder('Kale Ayarları')
        }

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.resources.items.areaResetTexture.magFilter = THREE.NearestFilter
        this.resources.items.areaResetTexture.minFilter = THREE.LinearFilter

        // Yeşil futbol sahası zemini ekle
        this.setFootballField()
        
        // Bowling (futbol) mini oyununu kur
        this.setBowling()
    }

    // Yeşil futbol sahası zemini oluştur
    setFootballField() {
        // Saha boyutları
        const fieldWidth = 33
        const fieldHeight = 15
        
        // Yeşil zemin geometrisi
        const planeGeometry = new THREE.PlaneGeometry(fieldWidth, fieldHeight)
        
        // Futbol sahası texture'ı oluştur - iç içe yeşil renk tonlarıyla
        const canvas = document.createElement('canvas')
        canvas.width = 256
        canvas.height = 256
        const context = canvas.getContext('2d')
        
        // Açık yeşil taban rengi
        context.fillStyle = '#4CAF50' // Ana yeşil renk
        context.fillRect(0, 0, canvas.width, canvas.height)
        
        // Çim efekti ekle - daha koyu yeşil çizgiler
        context.strokeStyle = '#388E3C' // Koyu yeşil
        context.lineWidth = 2
        
        // Dikey çim çizgileri
        for (let i = 0; i < canvas.width; i += 8) {
            context.beginPath()
            context.moveTo(i, 0)
            context.lineTo(i, canvas.height)
            context.stroke()
        }
        
        // Yatay çim çizgileri
        for (let i = 0; i < canvas.height; i += 20) {
            context.beginPath()
            context.moveTo(0, i)
            context.lineTo(canvas.width, i)
            context.stroke()
        }
        
        // Saha çizgileri ekle - beyaz
        context.strokeStyle = '#FFFFFF'
        context.lineWidth = 6
        
        // Dış sınır
        context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)
        
        // Orta çizgi
        context.beginPath()
        context.moveTo(canvas.width / 2, 20)
        context.lineTo(canvas.width / 2, canvas.height - 20)
        context.stroke()
        
        // Orta daire
        context.beginPath()
        context.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2)
        context.stroke()
        
        // Texture oluştur
        const fieldTexture = new THREE.CanvasTexture(canvas)
        fieldTexture.wrapS = THREE.RepeatWrapping
        fieldTexture.wrapT = THREE.RepeatWrapping
        fieldTexture.repeat.set(1, 1)
        
        // Material oluştur
        const fieldMaterial = new THREE.MeshBasicMaterial({
            map: fieldTexture,
            side: THREE.DoubleSide
        })
        
        // Mesh oluştur
        this.footballField = new THREE.Mesh(planeGeometry, fieldMaterial)
        this.footballField.rotation.x = -Math.PI  // Yatay konuma getir    
        this.footballField.position.set(this.x + 5, this.y + 5, 0.01) // Pozisyonu ayarla (z = 0.01 ile zemzerinde olsun)
        
        // Sahneye ekle
        this.container.add(this.footballField)
    }

    setBowling()
    {
        this.bowling = {}
        this.bowling.x = this.x + 15
        this.bowling.y = this.y + 4

        // Top konumu ve kalenin konumu
        const ballPositionX = this.bowling.x - 5  // Topun X pozisyonu
        const ballPositionY = this.bowling.y      // Topun Y pozisyonu
        
        // Collider (trigger) konum ve boyutları - sabit kalsın
        const triggerWidth = 5.0   // Çarpışma alanı genişliği 
        const triggerDepth = 10.0  // Çarpışma alanı derinliği
        const triggerHeight = 3.0  // Çarpışma alanı yüksekliği
        
        // Collider konumu - sabit ve sahanın sonlarında
        const goalPositionX = this.bowling.x - 25  // Sahanın en sonunda
        const goalPositionY = this.bowling.y       // Topla aynı Y düzleminde
        const goalPositionZ = 0                    // Z ekseninde zeminde
        
        // Kale modeli fiziksel özellikleri - collider'a göre 
        const goalWidth = triggerWidth * 0.8   // Collider genişliğinin %80'i
        const goalDepth = 1.0                  // Derinlik sabit kalsın  
        const goalHeight = triggerHeight * 0.8 // Collider yüksekliğinin %80'i

        // Kale modelini ekle - kale.glb
        if (this.resources.items.kaleModel) {
            console.log('Futbol kalesi yükleniyor...')
            
            // Gol için görünür çarpışma alanı (trigger) ekle - önce collider'ı oluştur
            const triggerGeometry = new THREE.BoxGeometry(triggerWidth, triggerDepth, triggerHeight)
            const triggerMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.4,
                wireframe: true,
                visible: true
            })
            
            // Gol trigger alanını oluştur - kale pozisyonunda ve zeminden yüksekte
            this.bowling.goalTrigger = new THREE.Mesh(triggerGeometry, triggerMaterial)
            // Collider'ı yere oturtmak için yüksekliği yarısı kadar yükselt 
            this.bowling.goalTrigger.position.set(goalPositionX, goalPositionY, goalPositionZ + triggerHeight/2)
            this.container.add(this.bowling.goalTrigger)
            
            // Debug için helper - collider'ın sınırlarını göstermek için
            if (this.debug) {
                this.bowling.helper = new THREE.BoxHelper(this.bowling.goalTrigger, 0xffff00)
                this.container.add(this.bowling.helper)
            }
            
            // Kale container - tam olarak collider ile aynı konumda
            this.bowling.goalContainer = new THREE.Object3D()
            this.bowling.goalContainer.position.copy(this.bowling.goalTrigger.position)
            
            // Kale modeli
            this.bowling.goalModel = this.resources.items.kaleModel.scene.clone()
            
            // Kale modelini collider boyutuna uygun ölçeklendir
            this.bowling.goalModel.scale.set(
                this.kaleSettings ? this.kaleSettings.scale : 1.2,
                this.kaleSettings ? this.kaleSettings.scale : 1.2,
                this.kaleSettings ? this.kaleSettings.scale : 1.2
            )
            
            // Kaleyi döndür - collider'a bakacak şekilde
            this.bowling.goalModel.rotation.x = this.kaleSettings ? this.kaleSettings.rotationX : Math.PI / 2
            this.bowling.goalModel.rotation.y = this.kaleSettings ? this.kaleSettings.rotationY : Math.PI
            
            // Kaleyi tam collider'a konumlandır (collider'ın alt kısmında)
            this.bowling.goalModel.position.set(
                this.kaleSettings ? this.kaleSettings.positionX : 0,
                this.kaleSettings ? this.kaleSettings.positionY : 0,
                this.kaleSettings ? this.kaleSettings.positionZ : -triggerHeight/2
            )
            
            // Kale modelini önce inceleyerek düzgün konumlandıralım
            console.log('Kale modeli bounding box:', new THREE.Box3().setFromObject(this.bowling.goalModel))
            
            // Kale modelinin tüm parçalarını döngü ile gezelim
            this.bowling.goalModel.traverse((child) => {
                if (child.isMesh) {
                    console.log('Kale mesh bulundu:', child.name)
                    
                    // Mesh'lere daha parlak materyal uygula
                    child.material = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        metalness: 0.5,
                        roughness: 0.1,
                        emissive: 0x333333,
                        emissiveIntensity: 0.7
                    });
                    
                    // Gölgeleri etkinleştir
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Modeli container'a ekle
            this.bowling.goalContainer.add(this.bowling.goalModel)
            this.container.add(this.bowling.goalContainer)
            
            console.log('Kale modeli başarıyla yüklendi')
            
            // Debug paneline kale kontrollerini ekle
            if (this.debug && this.kaleFolder) {
                // Kale ölçeği
                this.kaleFolder.add(this.kaleSettings, 'scale', 0.5, 3.0)
                    .name('Ölçek')
                    .onChange(() => {
                        this.bowling.goalModel.scale.set(
                            this.kaleSettings.scale,
                            this.kaleSettings.scale,
                            this.kaleSettings.scale
                        );
                    });
                    
                // Kale rotasyonu
                this.kaleFolder.add(this.kaleSettings, 'rotationX', 0, Math.PI * 2)
                    .name('Rotasyon X')
                    .onChange(() => {
                        this.bowling.goalModel.rotation.x = this.kaleSettings.rotationX;
                    });
                    
                this.kaleFolder.add(this.kaleSettings, 'rotationY', 0, Math.PI * 2)
                    .name('Rotasyon Y')
                    .onChange(() => {
                        this.bowling.goalModel.rotation.y = this.kaleSettings.rotationY;
                    });
                    
                // Kale pozisyonu
                this.kaleFolder.add(this.kaleSettings, 'positionX', -5, 5)
                    .name('Pozisyon X')
                    .onChange(() => {
                        this.bowling.goalModel.position.x = this.kaleSettings.positionX;
                    });
                    
                this.kaleFolder.add(this.kaleSettings, 'positionY', -5, 5)
                    .name('Pozisyon Y')
                    .onChange(() => {
                        this.bowling.goalModel.position.y = this.kaleSettings.positionY;
                    });
                    
                this.kaleFolder.add(this.kaleSettings, 'positionZ', -5, 5)
                    .name('Pozisyon Z')
                    .onChange(() => {
                        this.bowling.goalModel.position.z = this.kaleSettings.positionZ;
                    });
            }
            
        } else {
            console.warn('Kale modeli bulunamadı, basit kale oluşturuluyor')
            
            // Gol için görünür çarpışma alanı (trigger) ekle
            const triggerGeometry = new THREE.BoxGeometry(triggerWidth, triggerDepth, triggerHeight)
            const triggerMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                transparent: true,
                opacity: 0.4,
                wireframe: true,
                visible: true
            })
            
            // Gol trigger alanını oluştur
            this.bowling.goalTrigger = new THREE.Mesh(triggerGeometry, triggerMaterial)
            this.bowling.goalTrigger.position.set(goalPositionX, goalPositionY, goalPositionZ + triggerHeight/2)
            this.container.add(this.bowling.goalTrigger)
            
            // Kale çerçevesi için basit bir mesh oluştur
            const goalGeometry = new THREE.BoxGeometry(goalWidth, goalDepth, goalHeight)
            const goalMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false })
            this.bowling.goalMesh = new THREE.Mesh(goalGeometry, goalMaterial)
            
            // Kale mesh'i collider içinde konumlandır
            this.bowling.goalMesh.position.copy(this.bowling.goalTrigger.position)
            // Kale biraz daha alçakta olsun
            this.bowling.goalMesh.position.y -= 2; // Y ekseninde biraz geriye
            
            this.container.add(this.bowling.goalMesh)
        }
        
        // Kale pozisyonunu sakla - gol algılama için collider pozisyonunu kullan
        this.bowling.goalPosition = {
            x: this.bowling.goalTrigger.position.x,
            y: this.bowling.goalTrigger.position.y,
            z: this.bowling.goalTrigger.position.z
        }
        
        // Kale boyutlarını sakla - gol algılama için collider boyutlarını kullan
        this.bowling.goalSize = {
            width: triggerWidth,
            depth: triggerDepth,
            height: triggerHeight
        }
        
        // Bowling topu - futbol topu olarak kullan
        this.bowling.ball = this.objects.add({
            base: this.resources.items.bowlingBallBase.scene,
            collision: this.resources.items.bowlingBallCollision.scene,
            offset: new THREE.Vector3(ballPositionX, ballPositionY, 0),
            rotation: new THREE.Euler(Math.PI * 0.5, 0, 0),
            duplicated: true,
            shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: - 0.15, alpha: 0.35 },
            mass: 1,
            soundName: 'bowlingBall'
        })
        
        // Renk değiştirerek futbol topu gibi göster
        if (this.bowling.ball && this.bowling.ball.base) {
            this.bowling.ball.base.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshBasicMaterial({ color: 0xffffff })
                }
            })
        }

        // Gol Mesajı
        this.bowling.goalMessage = document.createElement('div')
        this.bowling.goalMessage.className = 'goal-message'
        this.bowling.goalMessage.style.position = 'absolute'
        this.bowling.goalMessage.style.top = '50%'
        this.bowling.goalMessage.style.left = '50%'
        this.bowling.goalMessage.style.transform = 'translate(-50%, -50%)'
        this.bowling.goalMessage.style.color = '#ff0000'
        this.bowling.goalMessage.style.fontSize = '48px'
        this.bowling.goalMessage.style.fontWeight = 'bold'
        this.bowling.goalMessage.style.display = 'none'
        this.bowling.goalMessage.style.zIndex = '1000'
        this.bowling.goalMessage.textContent = 'GOLLL!'
        
        document.body.appendChild(this.bowling.goalMessage)
        
        // Gol algılama
        this.bowling.hasScored = false
        
        // Eğer çarpışma olursa - basitleştirilmiş algılama yöntemi
        if (this.time) {
            this.time.on('tick', () => {
                if (this.bowling.ball && this.bowling.ball.collision && this.bowling.ball.collision.body) {
                    
                    // Top pozisyonunu al
                    const ballPosition = this.bowling.ball.collision.body.position
                    
                    // Topun kale içinde olup olmadığını kontrol et (basit kutu çarpışma kontrolü)
                    const goalPos = this.bowling.goalPosition
                    const goalSize = this.bowling.goalSize
                    
                    // Topun kale içinde olup olmadığını kontrol et
                    if (
                        ballPosition.x > goalPos.x - goalSize.width/2 && 
                        ballPosition.x < goalPos.x + goalSize.width/2 && // X ekseninde kale genişliği içinde
                        ballPosition.y > goalPos.y - goalSize.depth/2 && 
                        ballPosition.y < goalPos.y + goalSize.depth/2 && // Y ekseninde kale derinliği içinde (8 birim genişlik)
                        ballPosition.z > 0 && 
                        ballPosition.z < goalPos.z + goalSize.height/2 &&   // Z ekseninde kale yüksekliği içinde
                        !this.bowling.hasScored
                    ) {
                        this.bowling.hasScored = true
                        
                        // Ses çal
                        if (this.sounds) {
                            this.sounds.play('hit', 3)
                        }
                        
                        // Gol mesajını göster
                        this.bowling.goalMessage.style.display = 'block'
                        
                        // 3 saniye sonra mesajı gizle ve topu sıfırla
                        setTimeout(() => {
                            this.bowling.goalMessage.style.display = 'none'
                            
                            // Topu başlangıç pozisyonuna geri getir
                            this.bowling.reset();
                            
                            setTimeout(() => {
                                this.bowling.hasScored = false // Tekrar gol yapılabilmesi için
                            }, 1000)
                        }, 3000)
                    }
                }
            })
        }

        // Reset
        this.bowling.reset = () =>
        {
            // Reset ball - pozisyonunu başlangıç noktasına döndür
            if(this.bowling.ball && this.bowling.ball.collision)
            {
                this.bowling.ball.collision.reset()
                
                // Topun dönüşünü durdur
                if(this.bowling.ball.collision.body) {
                    this.bowling.ball.collision.body.angularVelocity.set(0, 0, 0)
                    this.bowling.ball.collision.body.velocity.set(0, 0, 0)
                }
            }
            
            // Reset gol mesajı
            if(this.bowling.goalMessage) {
                this.bowling.goalMessage.style.display = 'none'
            }
            
            // Reset gol durumu
            this.bowling.hasScored = false
        }

        // Reset area
        this.bowling.resetArea = this.areas.add({
            position: new THREE.Vector2(this.bowling.x - 15, this.bowling.y),
            halfExtents: new THREE.Vector2(2, 2),
            color: 0xffffff
        })
        this.bowling.resetArea.on('interact', () =>
        {
            this.bowling.reset()
        })

        // Reset label (bowling alanı sıfırlama etiketi)
        this.bowling.areaLabelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0xffffff, alphaMap: this.resources.items.areaResetTexture }))
        this.bowling.areaLabelMesh.position.x = this.bowling.x - 15
        this.bowling.areaLabelMesh.position.y = this.bowling.y
        this.bowling.areaLabelMesh.position.z = 0.1
        this.bowling.areaLabelMesh.matrixAutoUpdate = false
        this.bowling.areaLabelMesh.updateMatrix()
        this.container.add(this.bowling.areaLabelMesh)

        // Debug
        if(this.debugFolder)
        {
            this.debugFolder.add(this.bowling, 'reset').name('bowling reset')
        }
    }
}
