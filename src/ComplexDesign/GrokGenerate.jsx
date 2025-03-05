import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

function GrokGenerate() {
    // Reference for the instanced mesh (leaves)
    const leavesRef = useRef();

    // Set up leaf instance positions and rotations
    useEffect(() => {
        const mesh = leavesRef.current;
        for (let i = 0; i < 100; i++) {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 2,          // x: -1 to 1
            1.5 + (Math.random() - 0.5) * 1,    // y: 1 to 2 (above trunk)
            (Math.random() - 0.5) * 2           // z: -1 to 1
        );
        const rotation = new THREE.Euler(
            Math.random() * Math.PI,            // Random rotation around x
            Math.random() * Math.PI,            // Random rotation around y
            Math.random() * Math.PI             // Random rotation around z
        );
        matrix.makeRotationFromEuler(rotation);
        matrix.setPosition(position);
        mesh.setMatrixAt(i, matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, []);

    // Trunk shaders
    const trunkVertexShader = `
        varying vec2 vUv;
        void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const trunkFragmentShader = `
        varying vec2 vUv;
        void main() {
        float stripe = sin(vUv.y * 10.0);
        vec3 color = vec3(0.5, 0.3, 0.1); // Base brown color
        color += stripe * 0.1;             // Add striped variation
        gl_FragColor = vec4(color, 1.0);
        }
    `;

    // Leaf shaders
    const leafVertexShader = `
        varying vec2 vUv;
        void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
    `;

    const leafFragmentShader = `
        varying vec2 vUv;
        void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        float alpha = smoothstep(0.5, 0.4, dist); // Fade from center to edge
        vec3 color = vec3(0.0, 0.5, 0.0);         // Green color
        gl_FragColor = vec4(color, alpha);
        }
    `;

    return (
        <div className="mirror-comp">
            <Canvas className='three-canvas'>
            <perspectiveCamera position={[0, 1, 5]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            {/* Trunk */}
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 2, 32]} />
                <shaderMaterial vertexShader={trunkVertexShader} fragmentShader={trunkFragmentShader} />
            </mesh>
            {/* Leaves */}
            <instancedMesh ref={leavesRef} args={[null, null, 100]}>
                <planeGeometry args={[0.5, 0.5]} />
                <shaderMaterial 
                vertexShader={leafVertexShader} 
                fragmentShader={leafFragmentShader} 
                transparent={true} 
                />
            </instancedMesh>
            </Canvas>
        </div>
    );
}

export default GrokGenerate;