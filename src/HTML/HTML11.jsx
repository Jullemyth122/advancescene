import React, { useMemo, useRef } from 'react';
import './html.scss';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

const Scene = ({ samples = 6 }) => {
    const meshRef = useRef();
    const groupRef = useRef();
    const miniButterfliesRef = useRef();
    const txt = new THREE.TextureLoader().load('./img/X1.png');

    const counts = 15625;
    const numPerAxis = Math.ceil(Math.cbrt(counts));
    const gap = 0.1;
    const mid = (numPerAxis - 1) / 2;

    const baseColorsRef = useRef();
    const boundsRef = useRef({ maxDist: 0 });

    const { positions, colors } = useMemo(() => {
        const pos = new Float32Array(counts * 3);
        const clrs = new Float32Array(counts * 3);
        const color = new THREE.Color();

        const colorBase1 = new THREE.Color("#ffb3e6"); // light pink
        const colorBase2 = new THREE.Color("#c9a0ff"); // lavender
        const colorAccent = new THREE.Color("#a0f0ff"); // sky blue
        const colorWingTip = new THREE.Color("#b3ffe6"); // mint
        const colorEye = new THREE.Color("#ffff99"); // soft yellow
        const colorWhite = new THREE.Color("#ffffff");

        let maxDist = 0;
        let i = 0;

        for (let x = 0; x < numPerAxis; x++) {
            for (let y = 0; y < numPerAxis; y++) {
                for (let z = 0; z < numPerAxis; z++) {
                    if (i >= counts) break;
                    const dx = x - mid;
                    const dy = y - mid;
                    const dz = z - mid;

                    const tx = Math.abs(dx) / mid;
                    const ty = Math.abs(dy) / mid;
                    const tz = Math.abs(dz) / mid;

                    const factorx = Math.sin(tx * Math.PI * 0.5);
                    const factory = Math.sin(ty * Math.PI * 0.5);
                    const pX = dx * gap * factory;
                    const pY = dy * gap * factorx;
                    const pZ = dz * gap * (factorx + factory);

                    pos[i * 3 + 0] = pX;
                    pos[i * 3 + 1] = pY;
                    pos[i * 3 + 2] = pZ;

                    const dist = Math.sqrt(pX * pX + pY * pY + pZ * pZ);
                    if (dist > maxDist) maxDist = dist;

                    const eyePosX = 0.5;
                    const eyePosY = 0.6;
                    const eyeRadius = 0.2;
                    const distToEye = Math.sqrt(Math.pow(tx - eyePosX, 2) + Math.pow(ty - eyePosY, 2));

                    if (distToEye < eyeRadius) {
                        const eyePulse = 1.0 - (distToEye / eyeRadius);
                        color.copy(colorEye).lerp(colorWhite, eyePulse * 0.7);
                        color.multiplyScalar(2.5);
                    } else if (tx < 0.1 && tz < 0.1) {
                        color.copy(colorWhite).multiplyScalar(1.8);
                    } else if (tx > 0.92 || ty > 0.92) {
                        color.copy(colorWingTip).multiplyScalar(1.2);
                    } else {
                        const noise = noise2D(tx * 7.0, ty * 7.0);
                        const n = (noise + 1) / 2;
                        color.copy(colorBase1).lerp(colorBase2, n);
                        color.lerp(colorAccent, Math.pow(n, 2) * 0.5);
                    }

                    clrs[i * 3 + 0] = color.r;
                    clrs[i * 3 + 1] = color.g;
                    clrs[i * 3 + 2] = color.b;
                    i++;
                }
            }
        }

        baseColorsRef.current = clrs.slice();
        boundsRef.current = { maxDist };

        return { positions: pos, colors: clrs };
    }, []);

    const initRef = useRef();
    if (!initRef.current) initRef.current = positions.slice();

    // === Mini Butterflies (Instanced) ===
    const miniCount = 60;
    const miniScale = 0.12;
    const miniData = useMemo(() => {
        const offsets = new Float32Array(miniCount * 3);
        const scales = new Float32Array(miniCount);
        const speeds = new Float32Array(miniCount);
        const phases = new Float32Array(miniCount);

        for (let i = 0; i < miniCount; i++) {
            offsets[i * 3 + 0] = (Math.random() - 0.5) * 18;
            offsets[i * 3 + 1] = (Math.random() - 0.5) * 12;
            offsets[i * 3 + 2] = (Math.random() - 0.5) * 18;

            scales[i] = miniScale * (0.7 + Math.random() * 0.6);
            speeds[i] = 0.3 + Math.random() * 0.4;
            phases[i] = Math.random() * Math.PI * 2;
        }
        return { offsets, scales, speeds, phases };
    }, []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        // Main butterfly animation (unchanged)
        const mesh = meshRef.current;
        if (mesh && mesh.geometry) {
            const posAttr = mesh.geometry.attributes.position;
            const colAttr = mesh.geometry.attributes.color;
            const posArr = posAttr.array;
            const colorArr = colAttr ? colAttr.array : null;
            const baseColorArr = baseColorsRef.current;
            const init = initRef.current;
            const count = Math.min(init.length / 3, posArr.length / 3);

            const flapFreq = 1.8;
            const maxAngle = Math.PI / 7;
            const secondaryFlap = Math.sin(t * flapFreq * 4) * 0.15;

            const breathSpeed = 0.8;
            const breathAmount = 0.06;
            const driftSpeed = 0.4;
            const driftAmount = 0.35;

            if (groupRef.current) {
                groupRef.current.position.y = Math.sin(t * driftSpeed) * driftAmount;
                groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
            }

            const breath = 1.0 + Math.sin(t * breathSpeed) * breathAmount;
            const { maxDist } = boundsRef.current;
            const pulseWidth = maxDist * 0.45;
            const pulseSpeed = 0.9;
            const timeInEvent = (t * pulseSpeed) % 1.0;
            const pulseRadius = timeInEvent * maxDist;
            const pulseFade = Math.sin(timeInEvent * Math.PI);

            const tmpAxis = new THREE.Vector3();
            const tmpP = new THREE.Vector3();
            const tmpQ = new THREE.Quaternion();
            const tmpColor = new THREE.Color();
            const glowColor = new THREE.Color("#ffebff");
            const tmpNormal = new THREE.Vector3();
            const tmpOffset = new THREE.Vector3();

            const displacementAmount = 0.3;
            const glowEasing = 2.0;

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const x0 = init[i3 + 0];
                const y0 = init[i3 + 1];
                const z0 = init[i3 + 2];

                tmpAxis.set(z0, 0, -x0).normalize();
                if (tmpAxis.lengthSq() < 1e-8) tmpAxis.set(0, 1, 0);

                const flap = Math.sin(t * flapFreq + secondaryFlap) * maxAngle;
                tmpQ.setFromAxisAngle(tmpAxis, flap);

                tmpP.set(x0, y0, z0).applyQuaternion(tmpQ);
                tmpP.x *= breath;
                tmpP.z *= breath;

                const distFromCenter = Math.hypot(x0, y0, z0);
                const distToShell = Math.abs(distFromCenter - pulseRadius);
                let glowIntensity = distToShell < pulseWidth
                    ? Math.pow(1.0 - distToShell / pulseWidth, 2.5) * pulseFade
                    : 0;

                const rim = Math.max(0, 1.0 - distToShell / (pulseWidth * 0.2));
                const combined = Math.min(1, glowIntensity + rim * 0.4);
                const eased = Math.pow(combined, glowEasing);

                tmpNormal.copy(tmpP).normalize();
                tmpOffset.copy(tmpNormal).multiplyScalar(eased * displacementAmount);
                tmpP.add(tmpOffset);

                posArr[i3 + 0] = tmpP.x;
                posArr[i3 + 1] = tmpP.y;
                posArr[i3 + 2] = tmpP.z;

                if (colorArr && baseColorArr) {
                    tmpColor.setRGB(baseColorArr[i3 + 0], baseColorArr[i3 + 1], baseColorArr[i3 + 2]);
                    const hsl = tmpColor.getHSL({ h: 0, s: 0, l: 0 });
                    tmpColor.setHSL(
                        (hsl.h + eased * 0.15) % 1,
                        Math.min(1, hsl.s + eased * 0.3),
                        Math.min(1, hsl.l + eased * 0.4)
                    );
                    tmpColor.lerp(glowColor, eased * 0.8);

                    colorArr[i3 + 0] = tmpColor.r;
                    colorArr[i3 + 1] = tmpColor.g;
                    colorArr[i3 + 2] = tmpColor.b;
                }
            }

            posAttr.needsUpdate = true;
            if (colAttr) colAttr.needsUpdate = true;
        }

        // Animate mini butterflies
        if (miniButterfliesRef.current) {
            miniButterfliesRef.current.rotation.y = t * 0.08;

            const dummy = new THREE.Object3D();
            for (let i = 0; i < miniCount; i++) {
                const speed = miniData.speeds[i];
                const phase = miniData.phases[i];

                const offsetY = Math.sin(t * speed + phase) * 2.5;
                const offsetX = Math.sin(t * speed * 0.7 + phase) * 3;

                dummy.position.set(
                    miniData.offsets[i * 3 + 0] + offsetX,
                    miniData.offsets[i * 3 + 1] + offsetY,
                    miniData.offsets[i * 3 + 2]
                );

                const pulse = 0.8 + Math.sin(t * speed * 3 + phase) * 0.2;
                dummy.scale.setScalar(miniData.scales[i] * pulse);

                const rotSpeed = speed * 0.5;
                dummy.rotation.y = t * rotSpeed + phase;

                dummy.updateMatrix();
                miniButterfliesRef.current.setMatrixAt(i, dummy.matrix);
            }
            miniButterfliesRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Main Butterfly */}
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={counts} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={counts} array={colors} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial
                    size={0.06}
                    sizeAttenuation
                    map={txt}
                    vertexColors
                    transparent
                    depthWrite={false}
                    alphaTest={0.1}
                    opacity={0.95}
                />
            </points>

            {/* Mini Glowing Butterflies */}
            <instancedMesh ref={miniButterfliesRef} args={[null, null, miniCount]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                    map={txt}
                    transparent
                    opacity={1}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    alphaTest={0.1}
                />
            </instancedMesh>
        </group>
    );
};

const HTML11 = () => {
    return (
        <div className='html-canvas'>
            <Canvas camera={{ position: [0, 2.5, 9], fov: 75 }}>
                <color attach="background" args={['#1a0033']} />
                <fog attach="fog" args={['#1a0033', 5, 25]} />

                {/* Soft ground plane */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="#2d1b4d" emissive="#3d2b6e" emissiveIntensity={0.2} />
                </mesh>

                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 7]} intensity={1.2} color="#ffebff" />

                <Scene samples={6} />

                <OrbitControls autoRotate autoRotateSpeed={0.15} enableZoom enablePan />

                <EffectComposer>
                    <Bloom
                        intensity={3.2}
                        luminanceThreshold={0.3}
                        luminanceSmoothing={0.9}
                        mipmapBlur
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default HTML11;