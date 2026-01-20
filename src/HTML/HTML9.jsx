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
    const txt = new THREE.TextureLoader().load('./img/X1.png');

    // --- ADDED MISSING VARIABLE DEFINITIONS ---
    const counts = 15625;
    const numPerAxis = Math.ceil(Math.cbrt(counts));
    const gap = 0.1;
    const mid = (numPerAxis - 1) / 2;
    // -----------------------------------------

    const baseColorsRef = useRef();
    const boundsRef = useRef({ maxDist: 0 }); 

    const { positions, colors } = useMemo(() => {
        const pos = new Float32Array(counts * 3);
        const clrs = new Float32Array(counts * 3);
        const color = new THREE.Color();
        
        const colorOrange = new THREE.Color("#034efc");
        const colorYellow = new THREE.Color("#427afc");
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

                    const dist = Math.sqrt(pX*pX + pY*pY + pZ*pZ);
                    if (dist > maxDist) maxDist = dist;

                    const eyePosX = 0.5;
                    const eyePosY = 0.6;
                    const eyeRadius = 0.2;
                    const distToEye = Math.sqrt(Math.pow(tx - eyePosX, 2) + Math.pow(ty - eyePosY, 2));

                    if (distToEye < eyeRadius) {
                        const eyePulse = 1.0 - (distToEye / eyeRadius);
                        color.set(colorYellow).lerp(colorWhite, eyePulse);
                        color.multiplyScalar(3.0);
                    } else if (tx < 0.1 && tz < 0.1) {
                        color.set(colorWhite).multiplyScalar(2.5);
                    } else if (tx > 0.95 || ty > 0.95) {
                        color.set('black');
                    } else {
                        const noiseFrequency = 6.0;
                        const noise = noise2D(tx * noiseFrequency, ty * noiseFrequency);
                        const normalizedNoise = (noise + 1) / 2;
                        color.set(colorOrange).lerp(colorYellow, normalizedNoise);
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
    }, [counts, numPerAxis, gap, mid]);

    const initRef = useRef();
    if (!initRef.current) initRef.current = positions.slice();

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        const mesh = meshRef.current;
        if (!mesh || !mesh.geometry) return;

        const posAttr = mesh.geometry.attributes.position;
        const colAttr = mesh.geometry.attributes.color;
        if (!posAttr) return;

        const posArr = posAttr.array;
        const colorArr = colAttr ? colAttr.array : null;
        const baseColorArr = baseColorsRef.current;
        const init = initRef.current;
        const count = Math.min(init.length / 3, posArr.length / 3); // safety

        const flapFreq = 2.5;
        const maxAngle = Math.PI / 6;

        const breathSpeed = 1.0;
        const breathAmount = 0.05;
        const driftSpeed = 0.5;
        const driftAmount = 0.3;

        if (groupRef.current) {
            groupRef.current.position.y = Math.sin(t * driftSpeed) * driftAmount;
        }

        const breath = 1.0 + Math.sin(t * breathSpeed) * breathAmount;

        const pulseSpeed = 1.0;
        const { maxDist } = boundsRef.current || { maxDist: 1.0 };
        const pulseWidth = maxDist * 0.4;

        const timeInEvent = (t * pulseSpeed) % 1.0;
        const pulseRadius = timeInEvent * maxDist;
        const pulseFade = Math.sin(timeInEvent * Math.PI);

        // temp reuse objects (create once per frame, not per-vertex)
        const tmpAxis = new THREE.Vector3();
        const tmpP = new THREE.Vector3();
        const tmpQ = new THREE.Quaternion();
        const tmpColor = new THREE.Color();
        const glowColor = new THREE.Color("#f0c697");
        const tmpNormal = new THREE.Vector3();
        const tmpOffset = new THREE.Vector3();
        const eps = 1e-8;

        // tuning knobs
        const displacementAmount = 0.25;   // how far vertices push outward when glowing
        const timePulseAmount = 0.6;      // extra temporal pulse added to glowIntensity
        const timePulseSpeed = 2.4;       // speed of the time-phase pulse
        const hueShiftAmount = 0.12;      // how much hue shifts at full glow
        const glowEasing = 1.6;           // Math.pow(eased, glowEasing) for nicer falloff


        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            const x0 = init[i3 + 0];
            const y0 = init[i3 + 1];
            const z0 = init[i3 + 2];

            // safe axis building (avoid zero-length axis)
            tmpAxis.set(z0, 0, -x0);
            if (tmpAxis.lengthSq() < eps) {
                tmpAxis.set(0, 1, 0);
            } else {
                tmpAxis.normalize();
            }

            // flap rotation
            const flap = Math.sin(t * flapFreq) * maxAngle;
            tmpQ.setFromAxisAngle(tmpAxis, flap);

            // rotate base point and apply breath
            tmpP.set(x0, y0, z0).applyQuaternion(tmpQ);
            tmpP.x *= breath;
            tmpP.z *= breath;

            // --- compute pulse/glow (original distance used for stable shell) ---
            const distFromCenter = Math.hypot(x0, y0, z0);
            const distToShell = Math.abs(distFromCenter - pulseRadius);
            let glowIntensity = 0;
            if (distToShell < pulseWidth) {
                const x = 1.0 - (distToShell / pulseWidth);
                glowIntensity = Math.pow(x, 3.0) * pulseFade; // sharper rim (pow 3)
            }
            // per-vertex phase (stable deterministic pseudo-phase from coordinates)
            // this creates a subtle stagger so the pulse looks organic
            // const phase = Math.sin(x0 * 12.9898 + y0 * 78.233 + z0 * 37.719);
            // const timePulse = (Math.sin(t * timePulseSpeed + phase * 3.0) + 1) * 0.5; // 0..1

            // // combine spatial glow with time pulse
            // const combined = Math.min(1, glowIntensity + timePulse * timePulseAmount);
            // const eased = Math.pow(combined, glowEasing);
            // small rim boost
            const rim = Math.max(0, 1.0 - (distToShell / (pulseWidth*0.15)));
            const combined = Math.min(1, glowIntensity + rim * 0.35);
            const eased = Math.pow(combined, glowEasing);

            // --- displace vertex outward along its normal by eased*displacementAmount ---
            // normal here is simply the normalized rotated position (good for radial objects)
            tmpNormal.copy(tmpP);
            if (tmpNormal.lengthSq() < eps) {
                tmpNormal.set(0, 1, 0);
            } else {
                tmpNormal.normalize();
            }
            tmpOffset.copy(tmpNormal).multiplyScalar(eased * displacementAmount);
            tmpP.add(tmpOffset);

            // write updated positions
            posArr[i3 + 0] = tmpP.x;
            posArr[i3 + 1] = tmpP.y;
            posArr[i3 + 2] = tmpP.z;

            // --- color update: base color -> hue shift -> lerp to glowColor by eased ---
            if (colorArr && baseColorArr) {
                tmpColor.setRGB(baseColorArr[i3 + 0], baseColorArr[i3 + 1], baseColorArr[i3 + 2]);

                // small hue shift based on eased
                // (get/set HSL is okay for moderate vertex counts; if very large, precompute HSL)
                const hsl = {};
                tmpColor.getHSL(hsl); // hsl={h,s,l}
                hsl.h = (hsl.h + eased * hueShiftAmount) % 1.0;
                // slightly brighten on glow
                hsl.l = Math.min(1.0, hsl.l + eased * 0.25);
                tmpColor.setHSL(hsl.h, hsl.s, hsl.l);

                // final blend toward warm glow color
                tmpColor.lerp(glowColor, Math.min(1, eased * 0.95));

                colorArr[i3 + 0] = tmpColor.r;
                colorArr[i3 + 1] = tmpColor.g;
                colorArr[i3 + 2] = tmpColor.b;
            }
        }

        posAttr.needsUpdate = true;
        if (colAttr) colAttr.needsUpdate = true;
    });


    return (
        <group ref={groupRef}>
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute attach={"attributes-position"} count={counts} array={positions} itemSize={3} />
                    <bufferAttribute attach={"attributes-color"} count={counts} array={colors} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial
                    size={0.05}
                    sizeAttenuation
                    map={txt}
                    vertexColors={true}
                    depthWrite={false}
                    alphaTest={0.5}
                />
            </points>
        </group>
    );
};

const HTML9 = () => { // Renamed to avoid conflicts
    return (
        <div className='html-canvas'>
            <Canvas camera={{ position: [0, 2.5, 9], fov: 75 }}>
                <color attach="background" args={['#100500']} />
                <Scene samples={6} />
                <OrbitControls autoRotate autoRotateSpeed={0.2} enableZoom={true} />
                <EffectComposer>
                    <Bloom
                        intensity={2.0}
                        luminanceThreshold={0.7}
                        luminanceSmoothing={0.1}
                        mipmapBlur={true}
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default HTML9;