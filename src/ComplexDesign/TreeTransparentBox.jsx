import React, { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GradientTexture, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

function OuterBox() {
    const meshRef = useRef()
    useEffect(() => {
        if (meshRef.current) {

            meshRef.current.renderOrder = 0

        }
    }, [])
    
    return (
        <mesh ref={meshRef} castShadow receiveShadow>
            <boxGeometry args={[4, 4, 4]} />
            <MeshTransmissionMaterial
            resolution={512}         
            samples={1}              
            transmission={1.0}         // transmission must be in [0,1]
            thickness={0.5}          // simulate glass thickness
            blur={[0.3, 0.3]}        // blur effect for a glassy look
            roughness={0.5}          
            side={THREE.DoubleSide}
            />
        </mesh>
  
    )
}

function InnerBox() {
    const meshRef = useRef()
    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.renderOrder = 2  
        }
    }, [])
    
    return (
        <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial>
            <GradientTexture
            stops={[0, 0.5, 1]}
            colors={['#033dfc', '#297eff', '#8cb8fa']}
            size={1024}
            />
        </meshBasicMaterial>
        </mesh>
    )
}

function InnerSphere() {
    const meshRef = useRef()
    useEffect(() => {
        if (meshRef.current) {
        meshRef.current.renderOrder = 1 // Render between outer and inner box
        }
    }, [])
    
    return (
        <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[2, 32, 16]}/>
        <MeshTransmissionMaterial
            resolution={512}
            samples={8}
            transmission={1}         
            thickness={0.3}
            blur={[1.0, 1.0]}
            roughness={0.5}
            side={THREE.DoubleSide}
            // Optionally disable depthWrite to help with transparency sorting
            depthWrite={false}
        />
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

export default function TreeTransparentBox() {
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
            <InnerSphere/>
            <InnerBox />
            <Stage />
            
            <OrbitControls />
        </Canvas>
        </div>
    )
}
