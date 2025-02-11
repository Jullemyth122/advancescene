import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const Scene = () => {
    const size = 20;
    const segments = 100;
    const halfSize = size / 2;
    const segmentSize = size / segments;
    const _color = new THREE.Color();

    // Load texture
    const textureImage = useLoader(THREE.TextureLoader, "/img/samp1.jpg");

    const geometry = useMemo(() => {
        const vertices = [];
        const normals = [];
        const colors = [];
        const indices = [];
        const uvs = [];

        // Create geometry
        for (let i = 0; i <= segments; i++) {
            const y = (i * segmentSize) - halfSize;
            for (let j = 0; j <= segments; j++) {
                const x = (j * segmentSize) - halfSize;
                const z = 0;  // Start with no initial Z deformation

                // Add position
                vertices.push(x, -y, z);

                // Normals
                normals.push(0, 0, 1);

                // Colors
                const r = (x / size) + 0.5;  // This normalizes the r component
                const g = (y / size) + 0.5;  // This normalizes the g component
                const b = (r + g) / 2;       // A simple rule to create a b component that depends on r and g
                
                _color.setRGB(r, g, b);
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

    // const handleMouseMove = (event) => {
    //     // Normalize mouse position to range [-1, 1]
    //     setMousePosition({
    //         x: (event.clientX / window.innerWidth) * 2 - 1,  // Normalize X
    //         y: -(event.clientY / window.innerHeight) * 2 + 1, // Normalize Y
    //     });
    // };

    // // Add mouse move event listener
    // useEffect(() => {
    //     window.addEventListener('mousemove', handleMouseMove);
    //     return () => {
    //         window.removeEventListener('mousemove', handleMouseMove);
    //     };
    // }, []);


    return (
        <>
            <pointLight position={[10, 10, 10]} intensity={0.5} />
            <ambientLight intensity={1} />
            <mesh geometry={geometry} material={material} />
        </>
    );
};

const BufferPlayAround2 = () => {
    return (
        <div className="mirror-comp">
            <Canvas className="three-canvas" flat gl={{ antialias: true }} camera={{ position: [0, 0, 20] }}>
                <Scene />
                <OrbitControls/>
            </Canvas>
        </div>
    );
};

export default BufferPlayAround2;
