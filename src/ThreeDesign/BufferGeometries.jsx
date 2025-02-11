import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

const Scene = () => {
    const lightRef = useRef();
    const size = 20;
    // const segments = 10;
    const segments = 50;
    const halfSize = size / 2;
    const segmentSize = size / segments;
    const _color = new THREE.Color();

    // Load texture
    const textureImage = useLoader(THREE.TextureLoader, "/img/samp2.jpg");

    // Create geometry with custom UVs
    const geometry = useMemo(() => {
        const vertices = [];
        const normals = [];
        const colors = [];
        const indices = [];
        const uvs = [];

        const smoothZ = (x, y) => {
            const frequency = 0.5;
            const amplitude = 5;
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
                const normalX = Math.sin(x * 1.0);
                const normalY = Math.tanh(y * 1.0);
                const normalZ = 1;
                const length = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
                normals.push(normalX / length, normalY / length, normalZ / length);

                // Colors
                const r = (x / size) + 0.5;
                const g = (y / size) + 0.5;
                _color.setRGB(r, g, 1);
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
            vertexColors: true,
            shininess: 50,
            specular: 0x111111,
            map: textureImage,
        });
    }, [textureImage]);

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();
        const positions = geometry.attributes.position.array; // Get the positions array
        const amplitude = 5; // Amplitude of the sine wave animation

        // Update z values (animate the vertices)
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i]; // x value (position is stored in a flat array: x, y, z, x, y, z, ...)
            const y = positions[i + 1]; // y value
            // Animate the z value using a sine wave function based on x and y positions
            const zOffset = Math.sin(x * 0.5 + elapsedTime) * Math.cos(y * 0.5 + elapsedTime) * amplitude;
            positions[i + 2] = zOffset; // Set the new z value
        }

        // Mark the position attribute for update
        geometry.attributes.position.needsUpdate = true;
    });

    // Light movement
    useFrame(({ clock }) => {
        if (lightRef.current) {
            lightRef.current.position.x = Math.cos(clock.getElapsedTime()) * 10;
            lightRef.current.position.z = Math.sin(clock.getElapsedTime()) * 10;
            // lightRef.current.position.y = Math.tan(clock.getElapsedTime()) * 10;
        }
    });

    // Create 100 meshes with 20-unit separation
    const meshes = [];
    for (let x = -2; x < 2; x++) {
        for (let y = -2; y < 2; y++) {
            for (let z = -2; z < 2; z++) {
                meshes.push(
                    <mesh
                        key={`${x}-${y}-${z}`}
                        position={[x * size, y * size, z * size]}
                        geometry={geometry}
                        material={material}
                    />
                );
            }
        }
    }

    return (
        <>
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <directionalLight ref={lightRef} castShadow position={[10, 10, 10]} intensity={1} />
            <ambientLight intensity={1} />
            {/* <mesh geometry={geometry} material={material} />
            <mesh position={[20,0,0]} geometry={geometry} material={material} />
            <mesh position={[-20,0,0]} geometry={geometry} material={material} /> */}
            {meshes}

        </>
    );
};

const BufferGeometries = () => {
    return (
        <div className='mirror-comp'>
            <Canvas className="three-canvas" flat gl={{ antialias: true }} camera={{ position: [0, 0, 20] }}>
                <Scene />
                <OrbitControls />
            </Canvas>
        </div>
    );
};

export default BufferGeometries;
