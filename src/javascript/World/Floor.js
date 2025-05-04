import * as THREE from 'three'
import FloorMaterial from '../Materials/Floor.js'

export default class Floor
{
    constructor(_options)
    {
        // Options
        this.debug = _options.debug

        // Container
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        // Geometry
        this.geometry = new THREE.PlaneGeometry(2, 2, 10, 10)

        // Colors
        this.colors = {}
        this.colors.topLeft = '#D6C685'
        this.colors.topRight = '#D6C685'
        this.colors.bottomRight = '#D6C685'
        this.colors.bottomLeft = '#D6C685'

        // Orta daire için özel renkler
        this.centerCircle = {
            x:-1,  // Merkez x koordinatı
            y: -29,  // Merkez y koordinatı
            radius: 10,  // Daire yarıçapı
            colors: {
                center: '#267C6B',  // Merkez rengi
                middle: '#1A4D42',  // Orta halka rengi
                outer: '#0D2E28'    // Dış halka rengi
            }
        }

        // Material
        this.material = new FloorMaterial()

        this.updateMaterial = () =>
        {
            const topLeft = new THREE.Color(this.colors.topLeft)
            const topRight = new THREE.Color(this.colors.topRight)
            const bottomRight = new THREE.Color(this.colors.bottomRight)
            const bottomLeft = new THREE.Color(this.colors.bottomLeft)
            const circleCenterColor = new THREE.Color(this.centerCircle.colors.center)
            const circleMiddleColor = new THREE.Color(this.centerCircle.colors.middle)
            const circleOuterColor = new THREE.Color(this.centerCircle.colors.outer)

            topLeft.convertLinearToSRGB()
            topRight.convertLinearToSRGB()
            bottomRight.convertLinearToSRGB()
            bottomLeft.convertLinearToSRGB()
            circleCenterColor.convertLinearToSRGB()
            circleMiddleColor.convertLinearToSRGB()
            circleOuterColor.convertLinearToSRGB()

            const data = new Uint8Array([
                Math.round(bottomLeft.r * 255), Math.round(bottomLeft.g * 255), Math.round(bottomLeft.b * 255), 255,
                Math.round(bottomRight.r * 255), Math.round(bottomRight.g * 255), Math.round(bottomRight.b * 255), 255,
                Math.round(topLeft.r * 255), Math.round(topLeft.g * 255), Math.round(topLeft.b * 255), 255,
                Math.round(topRight.r * 255), Math.round(topRight.g * 255), Math.round(topRight.b * 255), 255
            ])

            this.backgroundTexture = new THREE.DataTexture(data, 2, 2)
            this.backgroundTexture.magFilter = THREE.LinearFilter
            this.backgroundTexture.needsUpdate = true

            this.material.uniforms.tBackground.value = this.backgroundTexture

            // Orta daire için gradient texture oluştur
            const circleSize = 256
            const circleData = new Uint8Array(circleSize * circleSize * 4)
            
            for(let y = 0; y < circleSize; y++) {
                for(let x = 0; x < circleSize; x++) {
                    const dx = (x - circleSize/2) / (circleSize/2)
                    const dy = (y - circleSize/2) / (circleSize/2)
                    const distance = Math.sqrt(dx * dx + dy * dy)
                    
                    if(distance <= 1) {
                        let color
                        if(distance < 0.3) {
                            // Merkez rengi
                            color = circleCenterColor
                        } else if(distance < 0.7) {
                            // Orta halka rengi
                            const t = (distance - 0.3) / 0.4
                            color = new THREE.Color().lerpColors(circleCenterColor, circleMiddleColor, t)
                        } else {
                            // Dış halka rengi
                            const t = (distance - 0.7) / 0.3
                            color = new THREE.Color().lerpColors(circleMiddleColor, circleOuterColor, t)
                        }
                        
                        const index = (y * circleSize + x) * 4
                        circleData[index] = Math.round(color.r * 255)
                        circleData[index + 1] = Math.round(color.g * 255)
                        circleData[index + 2] = Math.round(color.b * 255)
                        circleData[index + 3] = 255
                    }
                }
            }

            const circleTexture = new THREE.DataTexture(circleData, circleSize, circleSize)
            circleTexture.magFilter = THREE.LinearFilter
            circleTexture.needsUpdate = true

            // Orta daire için material oluştur
            const circleMaterial = new THREE.MeshBasicMaterial({
                map: circleTexture,
                transparent: true,
                opacity: 0.9
            })

            // Orta daire için plane oluştur
            const circleGeometry = new THREE.CircleGeometry(
                this.centerCircle.radius,
                64
            )
            const circleMesh = new THREE.Mesh(circleGeometry, circleMaterial)
            circleMesh.position.set(
                this.centerCircle.x,
                this.centerCircle.y,
                0.01
            )
            this.container.add(circleMesh)

            
        }

        this.updateMaterial()

        // Mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.frustumCulled = false
        this.mesh.matrixAutoUpdate = false
        this.mesh.updateMatrix()
        this.container.add(this.mesh)

        // Debug
        if(this.debug)
        {
            const folder = this.debug.addFolder('floor')
            // folder.open()

            folder.addColor(this.colors, 'topLeft').onChange(this.updateMaterial)
            folder.addColor(this.colors, 'topRight').onChange(this.updateMaterial)
            folder.addColor(this.colors, 'bottomRight').onChange(this.updateMaterial)
            folder.addColor(this.colors, 'bottomLeft').onChange(this.updateMaterial)
        }
    }
}
