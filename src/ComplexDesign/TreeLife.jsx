import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { CylinderGeometry, MeshStandardMaterial } from 'three';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { KernelSize } from 'postprocessing';
import * as THREE from 'three'
// Recursive Branch component for the mystical, blooming tree
function Branch({ position, rotation, length, radius, depth, maxDepth }) {
  // Create branch/trunk geometry


  const geometry = useMemo(
    () => new CylinderGeometry(radius * 0.7, radius, length, 100),
    [radius, length]
  );

    const textureImage = useLoader(THREE.TextureLoader, "/img/samp1.jpg");

    // Glowing trunk material with a white/light-yellow tone
    const trunkMaterial = useMemo(
        () =>
        new MeshStandardMaterial({
            color: 0xfffafa,      // Snow white
            emissive: 0xffffe0,   // Light yellow glow
            emissiveIntensity: 0.1,
            metalness: 0.1,
            roughness: 0.9,
        }),
        []
    );

    let children = null;
    if (depth < maxDepth) {
        children = [];
        // Generate 2-3 branches with natural randomness
        const numBranches = Math.floor(Math.random() *2) +2;
        for (let i = 0; i < numBranches; i++) {
        const branchLength = length * (0.7 + Math.random() * 0.2);
        const branchRadius = radius * 0.7;
        const angleX = Math.random() * 0.5 + 0.2; // tilt upward
        const angleY = Math.random() * Math.PI * 10; // full rotation around Y
        const newRotation = [ -angleX, angleY, 0 ];
        const newPosition = [0, length, 0];
        children.push(
            <Branch
            key={i}
            position={newPosition}
            rotation={newRotation}
            length={branchLength}
            radius={branchRadius}
            depth={depth + 1}
            maxDepth={maxDepth}
            />
        );
        }
    } else {
        // At maximum depth, add a glowing bloom with a white/ivory tone
        const bloomMaterial = new MeshStandardMaterial({
        color: 0xfffff0,       // Ivory
        emissive: 0xffffe0,    // Light yellow glow
        emissiveIntensity: 3.5,
        metalness: 0.5,
        roughness: 0.5,
        });
        children = (
        <mesh position={[0, length, 0]}>
            <sphereGeometry args={[radius * 1.8, 16, 16]} />
            <primitive object={bloomMaterial} attach="material" />
        </mesh>
        );
    }

    return (
        <group position={position} rotation={rotation}>
        {/* Render the trunk/branch segment */}
        <mesh geometry={geometry} material={trunkMaterial} position={[0, length / 2, 0]} />
        {children}
        </group>
    );

}

const Scene = () => {

    const { camera, gl } = useThree();
    const controlsRef = useRef();

    // Ensuring the camera looks at (0, 100, 0)
    useEffect(() => {
        camera.lookAt(0, 10, 0); // Make sure the camera is focused on this point initially
        if (controlsRef.current) {
            controlsRef.current.target.set(0, 10, 0); // Set the OrbitControls target to (0, 100, 0)
            controlsRef.current.update(); // Update the controls to apply this target
        }
    }, [camera]);

    // If OrbitControls are active, update the camera target during each frame
    useFrame(() => {
        if (controlsRef.current) {
            controlsRef.current.update(); // This makes sure the controls are applied and the camera stays focused
        }
    });

    return (
        <>
            {/* Ambient and directional lights */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={0.8} />
            
            {/* The base trunk of the tree */}
            <Branch position={[0, 0, 0]} rotation={[0, 0, 0]} length={4} radius={0.25} depth={0} maxDepth={8} />
            

            {/* Space galaxy background using stars */}
            <Stars
            radius={100}
            depth={50}
            count={1000}
            factor={4}
            saturation={0}
            fade
            />

            {/* Improved Bloom effect with professional settings */}
            <EffectComposer>
            <Bloom 
                intensity={2.0}                // Boost the overall bloom intensity
                luminanceThreshold={0.2}         // Only bloom bright areas
                luminanceSmoothing={0.1}         // Sharp cutoff for bloom areas
                kernelSize={KernelSize.LARGE}    // Larger kernel for a smoother effect
                mipmapBlur                      // Enable mipmap blur for enhanced quality
            />
            </EffectComposer>

            <OrbitControls 
                ref={controlsRef}
                enableDamping
                dampingFactor={0.25}
                rotateSpeed={0.5}
                minAzimuthAngle={-Math.PI / 2}
                maxAzimuthAngle={Math.PI / 2.5}
                minPolarAngle={Math.PI / 2}
                maxPolarAngle={Math.PI / 4}
                minDistance={5}  // Set the minimum camera distance
                maxDistance={10} // Set the maximum camera distance
            />


        </>
    )
}


export default function TreeLife() {



    return (
        <div className="mirror-comp">
        <Canvas 
            className="three-canvas"
            camera={{ position: [0, 20, 0] }}
            style={{ background: 'black', height: '100vh', width: '100vw' }}
        >
            <Scene></Scene>
        </Canvas>
        </div>
    );
}
