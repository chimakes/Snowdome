import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

import snowflakeVertexShader from './shaders/snowflake/vertex.glsl'
import snowflakeFragmentShader from './shaders/snowflake/fragment.glsl'

/**
 * Base
 */
// Debug
// const gui = new GUI({ width: 340 })

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const fogParams = {
  near: 1.879,
  far: 6.652,
  color: '#ebebf1'
};

scene.fog = new THREE.Fog( fogParams.color, fogParams.near, fogParams.far );

// gui.add(fogParams, 'near', -10, 15, 0.001)
//   .name('Fog near')
//   .onChange((value) => {
//     scene.fog.near = value;
//   });

// gui.add(fogParams, 'far', 0.001, 30, 0.001)
//   .name('Fog far')
//   .onChange((value) => {
//     scene.fog.far = value;
//   });

// gui.addColor(fogParams, 'color')
//   .name('Fog color')
//   .onChange((value) => {
//    scene.fog.color.set(value);
// });


// Loaders
const textureLoader = new THREE.TextureLoader()
const hdrLoader = new HDRLoader()

// GLTF loader
const gltfLoader = new GLTFLoader()

/**
 * Textures
 */
const bakedTexture = textureLoader.load('snowdome_simplebake1.png')
const bakedTexture2 = textureLoader.load('snowdome_other_objects3.png')

bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace
bakedTexture2.flipY = false
bakedTexture2.colorSpace = THREE.SRGBColorSpace

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(30, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0.55, 2.15)
scene.add(camera)

// gui.add(camera.position, 'x').min(-10).max(10).step(0.01).name('cameraX')
// gui.add(camera.position, 'y').min(-10).max(10).step(0.01).name('cameraY')
// gui.add(camera.position, 'z').min(-10).max(10).step(0.01).name('cameraZ')

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Lights
 */
const environmentMap = await hdrLoader.loadAsync('anniversary_lounge_2k.hdr')
environmentMap.mapping = THREE.EquirectangularReflectionMapping
scene.background = environmentMap
scene.environment = environmentMap

scene.environmentRotation.y = 1.487

// gui.add(scene.backgroundRotation, 'y').min(0).max(Math.PI * 2).step(0.001).name('backgroundRotationY')
// gui.add(scene.environmentRotation, 'y').min(0).max(Math.PI * 2).step(0.001).name('environmentRotationY')

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Materials
 */
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture})
const bakedMaterial2 = new THREE.MeshBasicMaterial({map: bakedTexture2})

const glassMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0.08,
    metalness: 0,
    transmission: 0.96,
    ior: 1.2,
    thickness: 0.04
})

const emissionMaterial = new THREE.MeshBasicMaterial({color: 0xfdf8f2})


/**
 * Model
 */
gltfLoader.load(
    'snow_dome_normalfix.glb',
    (gltf) =>
    {
        const bakedMesh = gltf.scene.children.find((child) => {
            return child.name ==="snowdome"
        })
        bakedMesh.material = bakedMaterial

        const dome = gltf.scene.children.find((child) =>{
            return child.name === 'dome'
        })

        dome.material = glassMaterial
        
        gltf.scene.position.y = -0.15

        // gui.add(gltf.scene.position, 'y').min(-10).max(10).step(0.01)
        scene.add(gltf.scene)
    }
)

gltfLoader.load(
    'snow_dome_other_objects3.glb',
    (gltf) =>
    {
        const bakedMesh = gltf.scene.children.find((child) => {
            return child.name ==="other_objects001"
        })

        bakedMesh.material = bakedMaterial2

        // const window = gltf.scene.children.find((child) =>{
        //     return child.name === 'window_emission'
        // })      

        const window = gltf.scene.getObjectByName('window_emission')

        window.material = emissionMaterial
        
        gltf.scene.position.y = -0.15
        scene.add(gltf.scene)
    }
)

/**
 * snow
 */

const snowflakesCount = 5000
const geometry = new THREE.BufferGeometry()
let snowflakes = null

const minRange = -2
const maxRange = 2
const minHeight = 4

const textures = [
    textureLoader.load('./snowflakes/snowflakes_transparent.png')
]

const customUniforms = {
    uFadeStart: { value: 1 },
    uFadeEnd: { value: -0.1 }
}

const createSnowflakes = (count, texture, size) => {
    const positionsArray = new Float32Array(count * 3)
    const velocitiesArray = new Float32Array(count * 3)
    const sizesArray = new Float32Array(count)
    const textureIndex = new Float32Array(count)

    for(let i = 0; i < count; i++) {
        const i3 = i * 3

        // position
        positionsArray[i3] = Math.random() * (maxRange - minRange) + minRange;
        positionsArray[i3 + 1] = (Math.random()) * minHeight
        positionsArray[i3 + 2] =  Math.random() * (maxRange - minRange) + minRange;

        // velocity
        velocitiesArray[i3] = (Math.random() * 6 - 3) * 0.0007 
        velocitiesArray[i3 + 1] = (Math.random() * 5 + 0.12) * 0.0002
        velocitiesArray[i3 + 2] = (Math.random() * 6 - 3) * 0.0007

        // size
        sizesArray[i] = Math.random() * (1 - 0.7) + 0.7 

        // texture
        textureIndex[i] = Math.floor(Math.random() * 4)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3))
    geometry.setAttribute('aVelocity', new THREE.Float32BufferAttribute(velocitiesArray, 3))
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizesArray, 1))
    geometry.setAttribute('aTextureIndex', new THREE.BufferAttribute(textureIndex, 1))

    // Material
    texture.flipY = false
    const snowflakeMaterial = new THREE.ShaderMaterial({
        vertexShader: snowflakeVertexShader,
        fragmentShader: snowflakeFragmentShader,
        uniforms:
        {
            uSize: new THREE.Uniform(size),
            uTexture: new THREE.Uniform(texture),
            uFadeStart: customUniforms.uFadeStart,
            uFadeEnd: customUniforms.uFadeEnd
        },
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
    })

    // gui.add(snowflakeMaterial.uniforms.uFadeStart, 'value').min(-1).max(1).step(0.01).name('uFadeStart')
    // gui.add(snowflakeMaterial.uniforms.uFadeEnd, 'value').min(-3).max(1).step(0.01).name('uFadeEnd')

    // Points
    snowflakes = new THREE.Points(geometry, snowflakeMaterial)
    scene.add(snowflakes)
}

const snowflakesTexture = textures[0]
createSnowflakes(snowflakesCount, snowflakesTexture, 60)


function updateSnowflakes() {
    for(let i = 0; i < snowflakesCount * 3; i += 3) {
        snowflakes.geometry.attributes.position.array[i] -= snowflakes.geometry.attributes.aVelocity.array[i]
        snowflakes.geometry.attributes.position.array[i + 1] -= snowflakes.geometry.attributes.aVelocity.array[i + 1]
        snowflakes.geometry.attributes.position.array[i + 2] -= snowflakes.geometry.attributes.aVelocity.array[i + 2]

        // if snowflakes below fadeEnd, reset the position. Y is also handling the opacity in shader
        if(snowflakes.geometry.attributes.position.array[i + 1] < customUniforms.uFadeEnd.value) 
        {
            snowflakes.geometry.attributes.position.array[i] = Math.random() * (maxRange - minRange) + minRange;
            snowflakes.geometry.attributes.position.array[i + 1] = minHeight
            snowflakes.geometry.attributes.position.array[i + 2] = Math.random() * (maxRange - minRange) + minRange;
        }

        // wrapping x for continuous looking
        if(snowflakes.geometry.attributes.position.array[i] < minRange) {
            snowflakes.geometry.attributes.position.array[i] = maxRange
        } else if (snowflakes.geometry.attributes.position.array[i] > maxRange) {
            snowflakes.geometry.attributes.position.array[i] = minRange
        }

        // wrapping z
        if(snowflakes.geometry.attributes.position.array[i + 2] < minRange) {
            snowflakes.geometry.attributes.position.array[i + 2] = maxRange
        } else if (snowflakes.geometry.attributes.position.array[i + 2] > maxRange) {
            snowflakes.geometry.attributes.position.array[i + 2] = minRange
        }

    }

    snowflakes.geometry.attributes.position.needsUpdate = true
}


/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    updateSnowflakes()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()