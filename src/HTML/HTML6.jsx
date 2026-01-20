import React, { useEffect, useMemo, useRef } from 'react'
import './html.scss'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const Scene = ({ samples = 6 }) => {
    const meshRef = useRef()
    const txt = new THREE.TextureLoader().load('./img/X1.png')
    const counts = 3375; // or any number
    
    const { positions } = useMemo(() => {
        const numPerAxis = Math.ceil(Math.cbrt(counts));
        const gap = 0.1;
        const mid = (numPerAxis - 1) / 2;

        console.log( mid )
        const pos = new Float32Array(counts * 3);

        let i = 0;
        for (let x = 0; x < numPerAxis; x++) {
            for (let y = 0; y < numPerAxis; y++) {
                for (let z = 0; z < numPerAxis; z++) {
                    if (i >= counts) break;

                    pos[i * 3 + 0] = (x - mid) * gap;
                    pos[i * 3 + 1] = (y - mid) * gap;
                    pos[i * 3 + 2] = (z - mid) * gap;

                    i++;
                }
            }
        }

        return { positions: pos };
    }, [counts]);


    const { colors } = useMemo(() => {
        const numPerAxis = Math.ceil(Math.cbrt(counts));

        // console.log(numPerAxis)
        const clrs = new Float32Array(counts * 3);


        const gap = 0.1;
        const mid = (numPerAxis - 1) / 2;

        const topY = (numPerAxis - 1 - mid) * gap;     // highest Y
        const bottomY = (0 - mid) * gap;               // lowest Y
        const yRange = topY - bottomY || 1;

        let i = 0;
        for (let x = 0; x < numPerAxis; x++) {
            for (let y = 0; y < numPerAxis; y++) {
                for (let z = 0; z < numPerAxis; z++) {
                    if (i >= counts) break;


                    // compute actual Y position
                    const yPos = (y - mid) * gap;
                    
                    // normalize to [0, 1] for interpolation
                    const t = (yPos - bottomY) / yRange;

                    // Interpolate between blue and yellow
                    const color = new THREE.Color().setHSL(
                        (1 - t) * (220 / 360) + t * (60 / 360), // H from blue to yellow
                        // (1 - t) * 0.5,
                        1.0,
                        (1 - t) * 0.5 + t * 0.5               // L from dark to bright
                    );

                    clrs[i * 3 + 0] = color.r;
                    clrs[i * 3 + 1] = color.g;
                    clrs[i * 3 + 2] = color.b;
                    // clrs[i * 3 + 0] = (x - mid) * gap;
                    // clrs[i * 3 + 1] = (y - mid) * gap;
                    // clrs[i * 3 + 2] = (z - mid) * gap;

                    i++;
                }
            }
        }
        return { colors: clrs };
    },[counts])

    useEffect(() => {
        if(meshRef.current) {
            console.log(meshRef.current)
        }
    },[meshRef])

    const postRef = useRef()
    if(!postRef.current) {
        postRef.current = positions.slice();
    }

    useFrame(({ clock }) => {
        const tm = clock.getElapsedTime()
        const pos  = meshRef.current.geometry.attributes.position.array
        const post = postRef.current
    })

    // useFrame(({ clock }) => {
    //     const time = clock.getElapsedTime()
    //     const pos  = meshRef.current.geometry.attributes.position.array
    //     const post = postRef.current

    //     for (let j = 0; j < counts; j++) {
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
    //         // pos[i3 + 1] = y0
    //         //     + Math.sin(time * 2.0 + x0 * 5.0) * 0.1
    //         //     + Math.sin(time * 3.5 + z0 * 7.0) * 0.1
    //         pos[i3 + 2] = z0
    //             + Math.sin(time * 2.0 + x0 * 5.0) * 0.1
    //             + Math.sin(time * 3.5 + y0 * 7.0) * 0.1

    //         // const offset = Math.exp( -Math.pow((time % 3.0) - 1.5, 2) / 0.5 )
    //         // pos[i3 + 2] = z0 + (offset - 0.5) * 0.6
            
    //         // const t = ( (time + z0) % 1.0 ) - 0.5
    //         // pos[i3 + 2] = z0 + t * 0.4


    //         const t2 = (time * 2 + z0) % 2.0
    //         const tri2 = t2 < 1.0 ? t2 : 2.0 - t2  // 0→1→0
    //         pos[i3 + 1] = y0 + (tri2 - 0.5) * 0.4

    //         // const t3 = (time * 2 + z0) % 2.0
    //         // const tri3 = t3 < 1.0 ? t3 : 2.0 - t3  // 0→1→0
    //         // pos[i3 + 2] = z0 + (tri3 - 0.5) * 0.4

    //     }

    //     meshRef.current.geometry.attributes.position.needsUpdate = true
    // })

    return(
        <>
            <ambientLight/>
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach={"attributes-position"}
                        count={counts}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={counts}
                        // array={colors}
                        array={colors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    vertexColors
                    size={0.025}
                    sizeAttenuation
                    map={txt}
                    depthWrite={true}
                    alphaTest={0.5}
                    transparent
                    shadowSide={THREE.DoubleSide}
                    // alphaHash
                />
            </points>
        </>
    )
}
const HTML6 = () => {
    return (
        <div className='html-canvas'>
            <Canvas>
                <Scene samples={6} />
                <OrbitControls/>
            </Canvas>
        </div>
    )
}

export default HTML6