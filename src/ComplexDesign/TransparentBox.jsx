import React, { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GradientTexture, MeshTransmissionMaterial, Environment } from '@react-three/drei'
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

function CubeStage() {
    const size = 25;
    const half = size / 2;
    return (
        <group castShadow receiveShadow>
        {/* Bottom face */}
            <mesh
                rotation={[Math.PI / 2, 0, 0]} // Rotate so the plane is horizontal and its normal points downward.
                position={[0, -half, 0]}
                receiveShadow
            >
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial 
                    side={THREE.DoubleSide} 
                    color="#fff" 
                    roughness={0.2} // Low for reflectivity
                    metalness={0} // Non-metallic
                />
            </mesh>
            {/* Top face */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]} // Opposite rotation to face upward.
                position={[0, half, 0]}
                receiveShadow
            >
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial 
                    side={THREE.DoubleSide} 
                    color="#fff" 
                    roughness={0.2} // Low for reflectivity
                    metalness={0} // Non-metallic
                />
            </mesh>
            
            {/* Front face */}
            <mesh
                // No rotation needed – the plane is vertical with its normal facing forward by default.
                position={[0, 0, half]}
                receiveShadow
            >
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial 
                    side={THREE.DoubleSide} 
                    color="#fff" 
                    roughness={0.2} // Low for reflectivity
                    metalness={0} // Non-metallic
                />
            </mesh>
            
            {/* Back face */}
            <mesh
                rotation={[0, Math.PI, 0]} // Rotate 180° so the plane faces the opposite direction.
                position={[0, 0, -half]}
                receiveShadow
            >
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial 
                    side={THREE.DoubleSide} 
                    color="#fff" 
                    roughness={0.2} // Low for reflectivity
                    metalness={0} // Non-metallic
                />
            </mesh>
            
            {/* Left face */}
            <mesh
                rotation={[0, Math.PI / 2, 0]} // Rotate so the plane faces left.
                position={[-half, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial 
                    side={THREE.DoubleSide} 
                    color="#fff" 
                    roughness={0.2} // Low for reflectivity
                    metalness={0} // Non-metallic
                />
            </mesh>
            
            {/* Right face */}
            <mesh
                rotation={[0, -Math.PI / 2, 0]} // Rotate so the plane faces right.
                position={[half, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial 
                    side={THREE.DoubleSide} 
                    color="#fff" 
                    roughness={0.2} // Low for reflectivity
                    metalness={0} // Non-metallic
                />
            </mesh>
        </group>
    );
}


export default function TransparentBox() {

    const rimLightRef = useRef();

    useEffect(() => {
        if (rimLightRef.current) {
        rimLightRef.current.lookAt(0, 0, 0);
        }
    }, []);

    return (
        <div className="mirror-comp">
        <Canvas camera={{ position: [0, 0, 8] }} shadows>
            {/* <Environment preset="sunset" /> */}

            <ambientLight intensity={0.2} color="#ffffff" />

            <rectAreaLight
            width={10}
            height={10}
            color="#7e95fc" // Pink
            intensity={2}
            position={[-5, 5, 0]}
            rotation={[0, Math.PI / 2, 0]} // Face right (towards x=0)
            />
            <rectAreaLight
            width={10}
            height={10}
            color="#607cf7" // Blue
            intensity={2}
            position={[0, 5, 5]}
            rotation={[0, Math.PI, 0]} // Face forward (towards z=0)
            />
            <rectAreaLight
            width={10}
            color="#385bf5"
            height={10}
            intensity={2}
            position={[5, 5, 0]}
            rotation={[0, -Math.PI / 2, 0]} // Face left (towards x=0)
            />
            <rectAreaLight
            width={10}
            height={10}
            color="#002efc" // Cyan
            intensity={2}
            position={[0, 5, -5]}
            rotation={[0, 0, 0]} // Face backward (towards z=0)
            />

            {/* Ceiling rectAreaLight as key light */}
            <rectAreaLight
                width={10}
                height={10}
                color="#ffffff"
                intensity={2}
                position={[0, 9.9, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
            />

            {/* Optional directional light for shadows */}
            <directionalLight
                castShadow
                intensity={0.5}
                position={[0, 9, 0]}
                color="#ffffff"
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-radius={2}
                shadow-bias={-0.0001}
            />

            {/* Rim light for edge highlights */}
            <spotLight
                intensity={0.3}
                position={[0, 5, -10]}
                angle={Math.PI / 4}
                penumbra={1}
                color="#ffffff"
            />

            {/* Rim light: Backlight for edge highlights */}
            <spotLight
                ref={rimLightRef}
                intensity={0.3}
                position={[0, 5, -10]}
                angle={Math.PI / 4}
                penumbra={1}
                color="#ffffff"
            />
            {/* Point light for fill lighting */}
            {/* <pointLight
                intensity={0.5}
                position={[5, 5, -5]}
                color="#ffffff"
            /> */}
                
            <OuterBox />
            <InnerBox />
            <CubeStage />
            
            <OrbitControls />
        </Canvas>
        </div>
    )
}
