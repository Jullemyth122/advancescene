import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useRef, useMemo, useState } from 'react';
import { OrbitControls } from '@react-three/drei';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import * as THREE from 'three';

// Custom component for animated CSS3D panels
function HtmlObject({ children, index, radius, angle, isRotating, ...props }) {
    const object = useMemo(() => {
        const div = document.createElement('div');
        div.style.width = '140px';
        div.style.height = '80px';
        div.style.background = 'linear-gradient(135deg, #ff00cc, #3333ff)';
        div.style.borderRadius = '15px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = '#fff';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.fontSize = '18px';
        div.style.textShadow = '0 0 10px rgba(255,255,255,0.8)';
        div.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
        div.style.border = '3px solid #ffffff';
        div.style.transition = 'transform 0.3s ease, background 0.3s ease';
        div.innerText = children;

        // Hover effect
        div.addEventListener('mouseenter', () => {
            div.style.transform = 'scale(1.15) rotate(5deg)';
            div.style.background = 'linear-gradient(135deg, #ffcc00, #ff3300)';
        });
        div.addEventListener('mouseleave', () => {
            div.style.transform = 'scale(1)';
            div.style.background = 'linear-gradient(135deg, #ff00cc, #3333ff)';
        });

        return new CSS3DObject(div);
    }, [children]);

    const ref = useRef();
    const time = useRef(Math.random() * 10); // Random offset for animations

    useFrame((state) => {
        if (ref.current) {
            time.current += 0.03;
            // Wobble effect
            ref.current.rotation.z = Math.sin(time.current + index) * 0.1;
            // Pulse effect
            const scale = 1 + Math.sin(time.current * 2 + index) * 0.05;
            ref.current.scale.set(scale, scale, scale);
            // Glowing trail (simulated with slight position jitter)
            ref.current.position.x += Math.sin(time.current * 5) * 0.5;
            ref.current.position.z += Math.cos(time.current * 5) * 0.5;
        }
    });

    return (
        <primitive
            ref={ref}
            object={object}
            position={[radius * Math.sin(angle), index * 60 - 300, radius * Math.cos(angle)]}
            rotation={[0, angle + Math.PI, 0]}
            {...props}
        />
    );
}

// Enhanced particle system with color shifting
function Particles() {
    const particles = useRef();

    useFrame((state) => {
        if (particles.current) {
            particles.current.rotation.y += 0.002;
            particles.current.rotation.x += 0.001;
            const time = state.clock.getElapsedTime();
            particles.current.material.color.setHSL(Math.sin(time * 0.1) * 0.5 + 0.5, 0.8, 0.6);
        }
    });

    const particleGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 2500;
            const y = (Math.random() - 0.5) * 2500;
            const z = (Math.random() - 0.5) * 2500;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return geometry;
    }, []);

    return (
        <points ref={particles}>
            <primitive object={particleGeometry} />
            <pointsMaterial size={3} transparent opacity={0.7} />
        </points>
    );
}

// Burst particles on click
function BurstParticles({ position }) {
    const particles = useRef();
    const [visible, setVisible] = useState(true);

    useFrame(() => {
        if (particles.current && visible) {
            particles.current.scale.multiplyScalar(1.05);
            particles.current.material.opacity -= 0.02;
            if (particles.current.material.opacity <= 0) setVisible(false);
        }
    });

    const burstGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 50; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            vertices.push(x, y, z);
        }
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        return geometry;
    }, []);

    return (
        visible && (
            <points ref={particles} position={position}>
                <primitive object={burstGeometry} />
                <pointsMaterial color="#ff00ff" size={5} transparent opacity={1} />
            </points>
        )
    );
}

// Main scene with dynamic spiral and interactivity
const Scene = () => {
    const groupRef = useRef();
    const [isRotating, setIsRotating] = useState(true);
    const [rotationSpeed, setRotationSpeed] = useState(0.003);
    const [burstPositions, setBurstPositions] = useState([]);

    useFrame((state) => {
        if (groupRef.current && isRotating) {
            groupRef.current.rotation.y += rotationSpeed;
            // Dynamic spiral twist
            const twist = Math.sin(state.clock.getElapsedTime() * 0.5) * 100;
            groupRef.current.position.y = twist;
        }
    });

    const handleDrag = (e) => {
        setRotationSpeed(e.movementX * 0.0005);
        setIsRotating(true);
    };

    const handleClick = (position) => {
        setIsRotating(!isRotating);
        setBurstPositions((prev) => [...prev, position]);
    };

    const panels = Array.from({ length: 16 }).map((_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        const radius = 350 + Math.sin(index) * 50; // Wavy radius for variety
        return (
            <HtmlObject
                key={index}
                index={index}
                radius={radius}
                angle={angle}
                isRotating={isRotating}
                onClick={() => handleClick([radius * Math.sin(angle), index * 60 - 300, radius * Math.cos(angle)])}
                onPointerMove={handleDrag}
            >
                Panel {index + 1}
            </HtmlObject>
        );
    });

    return (
        <group ref={groupRef}>
            {panels}
            {burstPositions.map((pos, i) => (
                <BurstParticles key={i} position={pos} />
            ))}
        </group>
    );
};

// CSS3D Renderer setup
const CSS3DRendererComponent = ({ renderer }) => {
    const { scene, camera } = useThree();
    useFrame(() => renderer.render(scene, camera), 1);
    return null;
};

// Main component
const CSS3DShader2 = () => {
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

export default CSS3DShader2;
