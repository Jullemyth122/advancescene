import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import html2canvas from 'html2canvas';
import './shaders.scss';

// simple vertex shader
const vertexShader = /* glsl */`
    uniform float u_time;
    varying vec2 vUv;

    void main(){
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        modelPosition.x += sin(modelPosition.y * 4.0 + u_time * 2.0) * 0.15;
        vec4 viewPosition = viewMatrix * modelPosition;
        gl_Position = projectionMatrix * viewPosition;
    }
`;

// simple fragment shader (adjusted for texture)
const fragmentShader = /* glsl */`
    uniform float u_time;
    uniform sampler2D u_texture; // HTML as texture
    varying vec2 vUv;

    void main(){
        vec4 texColor = texture2D(u_texture, vUv);
        // animated stripe + color mix, blended with texture
        float stripe = smoothstep(0.45, 0.55, sin(vUv.y * 30.0 + u_time * 3.0));
        vec3 base = mix(vec3(0.1,0.7,0.9), vec3(1.0,0.9,0.3), vUv.x);
        vec3 col = mix(base, vec3(1.0), stripe * 0.6);
        // Blend: 50% texture, 50% shader effect (adjust mix factor)
        gl_FragColor = vec4(mix(texColor.rgb, col, 0.5), texColor.a);
    }
`;

function ShaderPlaneWithHtmlTexture() {
    const meshRef = useRef();
    const textureRef = useRef();
    const material = useMemo(() => new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
        u_time: { value: 0 },
        u_texture: { value: null },
        },
        transparent: true,
        side: THREE.DoubleSide,
    }), []);

    useEffect(() => {
        // Create offscreen DOM for capture
        const dom = document.createElement('div');
        dom.className = 'css-card';
        dom.innerHTML = `
        <div class="card-inner">
            <h3>CSS3D Element</h3>
            <p>Animated & synced with a shader plane.</p>
        </div>
        `;
        dom.style.width = '480px';
        dom.style.height = '256px';
        dom.style.position = 'absolute';
        dom.style.left = '-9999px';
        document.body.appendChild(dom);

        html2canvas(dom, { backgroundColor: null, scale: 2 }).then(canvas => { // Higher scale for better quality
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        material.uniforms.u_texture.value = texture;
        textureRef.current = texture;
        document.body.removeChild(dom);
        });
    }, [material]);

    useFrame((state, delta) => {
        material.uniforms.u_time.value += delta;
        if (textureRef.current) textureRef.current.needsUpdate = true; // If texture needs dynamic updates (remove if static)
    });

    return (
        <mesh ref={meshRef} material={material} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.0, 1.6, 16, 16]} /> {/* Reduced segments for better perf */}
        </mesh>
    );
}

export default function ShaderToy() {
    return (
        <div className='shaders-canvas'>
            <Canvas
                camera={{ position: [0, 0, 3], fov: 45 }}
                gl={{ clearColor: 'black' }}
                frameloop="demand" // Optimize: only render when needed (e.g., on orbit or animation)
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <ShaderPlaneWithHtmlTexture />
                <OrbitControls />
            </Canvas>
        </div>
    );
}