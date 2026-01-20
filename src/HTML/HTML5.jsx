import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import './html.scss'

const Scene = ({ amount = 6 }) => {
    const meshRef = useRef();
    const count = 500;

    // 3D positions (XYZ)
    const { positions } = useMemo(() => {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            arr[i * 3 + 0] = (Math.random() - 0.5) * 2; // X
            arr[i * 3 + 1] = (Math.random() - 0.5) * 2; // Y
            arr[i * 3 + 2] = (Math.random() - 0.5) * 2; // Z
        }
        return { positions: arr };
    }, [count]);

    // 4D colors (RGBA) - alpha set to 1 for full opacity
    const { colors } = useMemo(() => {
        const arr = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
            arr[i * 4 + 0] = ( Math.random() - 0.1 ) * 1.0; // R
            arr[i * 4 + 1] = .0; // G
            arr[i * 4 + 2] = 0.05; // B
            arr[i * 4 + 3] = ( Math.random() - 0.1 ) * 1.0;           // A (fully opaque)
        }
        return { colors: arr };
    }, [count]);

    useEffect(() => {
        if(meshRef.current) {
            console.log(meshRef.current)
        }
    },[meshRef])

    const postRef = useRef()
    if(!postRef.current) {
        postRef.current = positions.slice();
    }

    // useFrame(({ clock }) => {
    //     const time = clock.getElapsedTime()
    //     const pos  = meshRef.current.geometry.attributes.position.array
    //     const post = postRef.current

    //     for (let j = 0; j < count; j++) {
    //         const i3 = j * 3

    //         // base coords from original
    //         const x0 = post[i3 + 0]
    //         const y0 = post[i3 + 1]
    //         const z0 = post[i3 + 2]

    //         // EXAMPLE: each point wiggles *around* its original spot
    //         // pos[i3 + 0] = x0 + Math.sin(time * 2.0 + x0 * 5.0) * 0.1
    //         // pos[i3 + 1] = y0 + Math.cos(time * 3.0 + y0 * 4.0) * 0.1
    //         // pos[i3 + 2] = z0 + Math.tan(time * 1.5 + z0 * 6.0) * 0.1

    //         // pos[i3 + 0] = x0 + Math.sin(time * 2.0 + x0 * 5.0) * 0.1
    //         pos[i3 + 0] = x0
    //             + Math.sin(time * 2.0 + y0 * 5.0) * 0.1
    //             + Math.sin(time * 3.5 + z0 * 7.0) * 0.1
    //         pos[i3 + 1] = y0
    //             + Math.sin(time * 2.0 + x0 * 5.0) * 0.1
    //             + Math.sin(time * 3.5 + z0 * 7.0) * 0.1
    //         // pos[i3 + 2] = z0
    //         //     + Math.sin(time * 2.0 + x0 * 5.0) * 0.1
    //         //     + Math.sin(time * 3.5 + y0 * 7.0) * 0.1

    //         // const offset = Math.exp( -Math.pow((time % 3.0) - 1.5, 2) / 0.5 )
    //         // pos[i3 + 2] = z0 + (offset - 0.5) * 0.6
            
    //         // const t = ( (time + z0) % 1.0 ) - 0.5
    //         // pos[i3 + 2] = z0 + t * 0.4

    //         const t1 = (time * 2 + z0) % 2.0
    //         const tri = t1 < 1.0 ? t1 : 2.0 - t1  // 0→1→0
    //         pos[i3 + 2] = z0 + (tri - 0.5) * 0.4

    //     }

    //     meshRef.current.geometry.attributes.position.needsUpdate = true
    // })

    // useFrame(({ clock }) => {
    //     const t = clock.getElapsedTime()
    //     const phase = Math.floor((t / 5) % 3)
    //     const pos = meshRef.current.geometry.attributes.position.array
    //     const post = postRef.current

    //     for (let j = 0; j < count; j++) {
    //         const i3 = j*3
    //         const x0 = post[i3]
    //         const y0 = post[i3 + 1]
    //         const z0 = post[i3 + 2]

    //         let dz = 0
    //         if (phase === 0) {
    //             // radial ripple
    //             const r = Math.hypot(x0, y0)
    //             dz = Math.sin(r * 8 - t * 3) * 0.15
    //         } else if (phase === 1) {
    //             // perlin noise
    //             dz = noise.noise(x0 * .8, y0 * .8, t * .3) * 0.5
    //         } else {
    //             // triangle wave
    //             const m = ((t * 1.5 + z0) % 2) 
    //             const tri = m < 1 ? m : 2 - m
    //             dz = (tri - 0.5) * 0.4
    //         }

    //         pos[i3 + 0] = x0 + Math.sin(t + x0*5)*0.1
    //         pos[i3 + 1] = y0 + Math.cos(t*1.2 + y0*4)*0.1
    //         pos[i3 + 2] = z0 + dz
    //     }

    //     meshRef.current.geometry.attributes.position.needsUpdate = true
    // })
    // useFrame(({ clock }) => {
    //     const t    = clock.getElapsedTime()
    //     const ω    = 0.5                        // rotation speed (radians/sec)
    //     const pos  = meshRef.current.geometry.attributes.position.array
    //     const orig = postRef.current

    //     for (let i = 0; i < count; i++) {
    //     const i3 = i * 3
    //     const x0 = orig[i3 + 0]
    //     const y0 = orig[i3 + 1]
    //     const z0 = orig[i3 + 2]

    //     // polar coords
    //     const r     = Math.hypot(x0, y0)      // radius
    //     const θ0    = Math.atan2(y0, x0)      // starting angle
    //     const θ     = θ0 + ω * t              // rotated angle

    //     // convert back
    //     pos[i3 + 0] = Math.cos(θ) * r
    //     pos[i3 + 1] = Math.sin(θ) * r
    //     pos[i3 + 2] = z0                      // keep original Z (or add a small ripple)
    //     }

    //     meshRef.current.geometry.attributes.position.needsUpdate = true
    // })
    useFrame(({ clock }) => {
        const dt   = clock.getDelta()      // seconds since last frame
        const t    = clock.getElapsedTime()
        const freq = 4.0          // radial pulse frequency
        const amp  = 1.0        // radial pulse amplitude

        // parameters for speed mapping
        const baseSpeed  = 1.0             // slowest spin (at r0=0)
        const speedRange = 1.5             // extra spin at r0 >= maxR
        const maxR       = 100.0             // radius at which spin = base+range

        const pos  = meshRef.current.geometry.attributes.position.array
        const orig = postRef.current

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            const x0 = orig[i3]
            const y0 = orig[i3 + 1]
            const z0 = orig[i3 + 2]

            // polar coords
            const r0  = Math.hypot(x0, y0)
            const θ0  = Math.atan2(y0, x0)

            // map radius → speed [baseSpeed … baseSpeed+speedRange]
            const normR     = Math.min(r0 / maxR, 1.0)
            const spinSpeed = baseSpeed + speedRange * normR

            // integrate this point's angle using dt
            postRef.current[i] += spinSpeed * dt

            // combine with your existing oscillation
            const θ = θ0
                    + postRef.current[i]
                    + Math.sin(r0 * 3.0 - t * 2.0) * 0.3

            // radial breathing
            const r = r0 + Math.sin(t * freq - r0 * 2.0) * amp

            // write back
            pos[i3]     = Math.cos(θ) * r
            pos[i3 + 1] = Math.sin(θ) * r
            pos[i3 + 2] = z0 + Math.sin(t * 1.5 + r0 * 2.5) * 0.1
        }

        meshRef.current.geometry.attributes.position.needsUpdate = true
    })


    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach={"attributes-position"}
                    // array={positions}
                    array={positions}
                    count={count}
                    itemSize={3}
                />
                <bufferAttribute
                    attach={"attributes-color"}
                    array={colors}
                    count={count}
                    itemSize={4}
                />
            </bufferGeometry>
            <pointsMaterial
                vertexColors={true}  // Updated for newer Three.js
                size={0.1}           // Bigger points for visibility
                transparent={true}   // Kept in case you want alpha later
            />
        </points>
    );
};

const HTML5 = () => {
    return (
        <div className='html-canvas'>
            <Canvas
                gl={{ antialias: true }}
                shadows
                dpr={[1,2]}
                camera={{ position: [0,2, 0] }}
            >
                <Scene amount={2}/>
                <OrbitControls/>
            </Canvas>
        </div>  
    )
}

export default HTML5