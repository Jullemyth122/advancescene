import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useRef, useMemo, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as THREE from 'three';

// HtmlObject: A single HTML panel in 3D space
function HtmlObject({ position, rotation, content }) {
    const object = useMemo(() => {
        const div = document.createElement('div');
        div.style.width = '100px';
        div.style.height = '100px';
        div.style.background = 'linear-gradient(135deg, #ff00cc, #3333ff)';
        div.style.borderRadius = '10px';
        div.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = 'white';
        div.style.fontSize = '18px';
        div.innerText = content;
        return new CSS3DObject(div);
    }, [content]);

    const ref = useRef(object);
    const [targetScale, setTargetScale] = useState(1);

    useFrame(() => {
        if (ref.current) {
            const currentScale = ref.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
            ref.current.scale.set(newScale, newScale, newScale);
        }
    });

    useMemo(() => {
        object.element.addEventListener('click', () => {
            setTargetScale((prev) => (prev === 1 ? 1.5 : 1));
        });
    }, [object]);

    return <primitive ref={ref} object={object} position={position} rotation={rotation} />;
}

function Particles() {
    const particles = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return geometry;
    }, []);

    return (
        <points geometry={particles}>
        <pointsMaterial size={2} color={0xffffff} />
        </points>
    );
}

// Scene: Collection of HTML objects arranged in a circle
function Scene() {
    const groupRef = useRef();
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
        }
    });

    const count = 8;
    const radius = 300;
    return (
        <group ref={groupRef}>
        {Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            return (
            <HtmlObject
                key={i}
                position={[x, 0, z]}
                rotation={[0, -angle, 0]}
                content={`Panel ${i + 1}`}
            />
            );
        })}
        </group>
    );
}

// CSS3DRendererComponent: Handles rendering with CSS3DRenderer
function CSS3DRendererComponent({ renderer }) {
  const { scene, camera } = useThree();
  useFrame(() => {
    renderer.render(scene, camera);
  }, 1);
  return null;
}

// Main Component
const CSS3DShader3 = () => {
    const cssRenderer = useMemo(() => {
        const renderer = new CSS3DRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        renderer.domElement.style.top = '0';
        document.body.appendChild(renderer.domElement);
        return renderer;
    }, []);

    return (
        <Canvas
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(45deg, #0d001a, #1a0033, #330066)', // Neon aurora background
        }}
        camera={{ position: [0, 0, 1200] }}
        onCreated={({ gl }) => {
            gl.domElement.style.display = 'none'; // Hide WebGL canvas
        }}
        >
            <CSS3DRendererComponent renderer={cssRenderer} />
            <OrbitControls domElement={cssRenderer.domElement} enableZoom={false} />
            <Particles />
            <Scene />
        </Canvas>
    );
};

export default CSS3DShader3;