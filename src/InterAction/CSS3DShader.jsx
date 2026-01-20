import { Canvas, useFrame, useThree } from '@react-three/fiber';
import React, { useRef, useEffect, Suspense } from 'react';
import { Html } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

const CSS3DShader = () => {
    return (
        <>
            {/* Scrollable container */}
            <div className="scroll-container" style={{ height: '300vh' }} />
            {/* Fixed canvas */}
            <Canvas
                className="three-canvas"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                }}
                flat
                gl={{ antialias: true }}
                camera={{ position: [0, 0, 1] }}
            >
                <Suspense fallback={null}>
                    <Scene />
                </Suspense>
            </Canvas>
        </>
    );
};

const Scene = () => {
    const groupRef = useRef();
    const targetY = useRef(0);
    const targetZ = useRef(0);
    const currentY = useRef(0);
    const currentZ = useRef(0);

    useEffect(() => {
        const updateTargetPositions = () => {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const maxScroll = documentHeight - windowHeight;
            const scrollFraction = scrollPosition / maxScroll;
            targetY.current = scrollFraction * 50; // Adjust as needed
            targetZ.current = scrollFraction * 5; // Adjust as needed
        };

        window.addEventListener('scroll', updateTargetPositions);
        return () => window.removeEventListener('scroll', updateTargetPositions);
    }, []);

    useFrame(() => {
        if (groupRef.current) {
            currentY.current += (targetY.current - currentY.current) * 0.1;
            currentZ.current += (targetZ.current - currentZ.current) * 0.1;
            groupRef.current.position.y = currentY.current;
            groupRef.current.position.z = currentZ.current;
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <group ref={groupRef}>
                {Array.from({ length: 3 }).map((_, index) => (
                    <Html
                        transform
                        position={[0, -25 * index, -5]}
                        key={index}
                    >
                        <div
                            className="dish"
                            style={{
                                background: 'linear-gradient(to left, #83acfc, #2670ff)',
                                // padding: '10px',
                                borderRadius: '5px',
                                height: '50px',
                                width: '100px',
                            }}
                        >
                            Section {index + 1}
                        </div>
                    </Html>
                ))}
            </group>
        </>
    );
};


export default CSS3DShader
