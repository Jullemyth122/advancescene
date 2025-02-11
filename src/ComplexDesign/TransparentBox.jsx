import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GradientTexture, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

function OuterBox() {
    return (
        <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 3, 3]} />
        <MeshTransmissionMaterial
            resolution={512}         // Texture resolution for the transmission effect
            samples={1}              // Number of samples for the blur effect
            transmission={2}         // Fully transmissive material (like glass)
            blur={[0.5, 0.5, 1]}         // Blur amounts for a glass-like effect
            roughness={0.5}          // Slight roughness adds realism
            side={THREE.DoubleSide}  // Render both sides of the box
        />
        </mesh>
    )
}

function InnerBox() {
    return (
        <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial>
            <GradientTexture
            stops={[0, 0.5, 1]}                // Positions for the gradient stops (0 to 1)
            // colors={['red', 'orange', 'yellow']} // Colors at each stop
            colors={['#033dfc', '#297eff', '#8cb8fa']} // Colors at each stop
            size={1024}                        // Resolution of the gradient texture
            />
        </meshBasicMaterial>
        </mesh>
    )
}

function Stage() {
    return (
        <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]} 
        receiveShadow
        >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="gray" />
        </mesh>
    )
}

export default function TransparentBox() {
    return (
        <div className="mirror-comp">
        <Canvas camera={{ position: [0, 0, 8] }} shadows>
            {/* Ambient light for overall illumination */}
            <ambientLight intensity={0.5} />
            
            {/* Directional light simulates sunlight */}
            <directionalLight
            castShadow
            intensity={0.5}
            position={[5, 5, 5]}
            color="white"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            />
            
            {/* Spot light adds a colored accent */}
            <spotLight
            castShadow
            intensity={1}
            position={[-5, 5, 5]}
            angle={0.3}
            penumbra={0.5}
            color="pink"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            />
            
            <OuterBox />
            <InnerBox />
            <Stage />
            
            <OrbitControls />
        </Canvas>
        </div>
    )
}
