import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { MathUtils } from 'three'

const Scene = () => {
    const size = 20;
    // const segments = 10;
    const segments = 100;
    const halfSize = size / 2;
    const segmentSize = size / segments;
    const _color = new THREE.Color();

    // Load texture
    const textureImage = useLoader(THREE.TextureLoader, "/img/samp1.jpg");


    const { camera } = useThree(); // Access camera directly from the scene
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Track mouse position
    const targetPosition = useRef(new THREE.Vector3(0, 0, 0)); // Target camera position
    const targetRotation = useRef(new THREE.Vector3(0, 0, 0)); // Target camera rotation
    const speed = 0.15;  // Controls how quickly the camera responds to the mouse
    const rotationSpeed = 0.1;  // Rotation speed for smooth rotation

    // Mouse move event listener to track mouse position
    useEffect(() => {
        const handleMouseMove = (event) => {
            // Normalize mouse position to range [-1, 1]
            setMousePosition({
                x: (event.clientX / window.innerWidth) * 2 - 1,  // Normalize X
                y: -(event.clientY / window.innerHeight) * 2 + 1, // Normalize Y
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useFrame(() => {
        // Calculate the target position based on mouse position
        targetPosition.current.set(
            Math.sin(mousePosition.x * Math.PI) * 20,  // X position
            Math.sin(mousePosition.y * Math.PI) * 20,  // Y position
            20 // Z position (distance from the center)
        );

        // Smoothly interpolate position toward target position
        camera.position.lerp(targetPosition.current, speed);

        // Smoothly rotate the camera towards the mouse direction
        targetRotation.current.y = mousePosition.x * Math.PI / 2;  // Rotate around Y-axis
        targetRotation.current.x = -mousePosition.y * Math.PI / 2; // Rotate around X-axis

        // Smoothly interpolate rotation towards target rotation
        camera.rotation.x += (targetRotation.current.x - camera.rotation.x) * rotationSpeed;
        camera.rotation.y += (targetRotation.current.y - camera.rotation.y) * rotationSpeed;

        // Always ensure the camera is looking at the center (or any specific target)
        camera.lookAt(0, 0, 0);
    });

    // Create geometry with custom UVs
    const geometry = useMemo(() => {
        const vertices = [];
        const normals = [];
        const colors = [];
        const indices = [];
        const uvs = [];

        const smoothZ = (x, y) => {
            const frequency = 0.1;
            const amplitude = 2;
            return Math.sin(x * frequency) * Math.cos(y * frequency) * amplitude;
        };

        for (let i = 0; i <= segments; i++) {
            const y = (i * segmentSize) - halfSize;
            for (let j = 0; j <= segments; j++) {
                const x = (j * segmentSize) - halfSize;
                const z = smoothZ(x, y);

                // Add position
                vertices.push(x, -y, z);

                // Normals
                normals.push( 0, 0, 1 );

                // Colors
                const r = (x / size) + 0.5;  // This normalizes the r component
                const g = (y / size) + 0.5;  // This normalizes the g component
                const b = (r + g) / 2;       // A simple rule to create a b component that depends on r and g
                
                _color.setRGB(r, g, b);
                colors.push(_color.r, _color.g, _color.b);

                
                colors.push(_color.r, _color.g, _color.b);

                // UVs
                const u = j / segments;
                const v = i / segments;
                uvs.push(u, v);
            }
        }

        // Indices (faces)
        for (let i = 0; i < segments; i++) {
            for (let j = 0; j < segments; j++) {
                const a = i * (segments + 1) + (j + 1);
                const b = i * (segments + 1) + j;
                const c = (i + 1) * (segments + 1) + j;
                const d = (i + 1) * (segments + 1) + (j + 1);

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setIndex(indices);
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); // Add UV attribute

        return geo;
    }, [segments, size, halfSize, segmentSize]);

    // Material with texture
    const material = useMemo(() => {
        return new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            shininess: 50,
            map: textureImage,
        });
    }, [textureImage]);


    useFrame(({ clock, camera }) => {
        const elapsedTime = clock.getElapsedTime();
        const positions = geometry.attributes.position.array; // Get the positions array
        const rippleSpeed = 1; // Speed of ripple expansion
        const amplitude = 3; // Height of the waves (Amplitude)
        
        const centerX = 0; // X-coordinate of the "drop" center
        const centerY = 0; // Y-coordinate of the "drop" center
    
        // Update z values (animate the vertices)
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i]; // x value (position is stored in a flat array: x, y, z, x, y, z, ...)
            const y = positions[i + 1]; // y value
    
            // Calculate the distance from the "center" of the drop (where the liquid drop hits)
            const distToCenter = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
    
            // Create multiple ripples over time
            const numRipples = 10; // Number of ripples that will be created
            let zOffset = 0;
    
            // Sum sine waves for multiple ripples
            for (let j = 0; j < numRipples; j++) {
                const ripplePhase = j * Math.PI / 2; // Offset for each ripple (staggered)
                const rippleFrequency = 0.5 + j * 0.2; // Frequency of each ripple (different for each)
                const waveEffect = Math.sin(distToCenter * rippleFrequency - elapsedTime * rippleSpeed + ripplePhase);
                zOffset += waveEffect * amplitude * Math.exp(-distToCenter * 0.05); // Apply damping based on distance
            }
    
            // Apply the ripple effect to the z position (height)
            positions[i + 2] = zOffset; // Set the new z value
        }
    
        // Mark the position attribute for update
        geometry.attributes.position.needsUpdate = true;

    });
    

    return (
        <>
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <ambientLight intensity={1} />
            <mesh geometry={geometry} material={material} />
        </>
    );
};

const BufferGeometriesInterAction = () => {
    return (
        <div className='mirror-comp'>
            <Canvas className="three-canvas" flat gl={{ antialias: true }} camera={{ position: [0, 0, 20] }}>
                <Scene />
                {/* <OrbitControls /> */}
            </Canvas>
        </div>
    );
};

export default BufferGeometriesInterAction;
