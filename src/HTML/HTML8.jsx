import React, { useEffect, useMemo, useRef } from 'react'
import './html.scss'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

const Scene = ({ samples = 6 }) => {
    const meshRef = useRef()
    const txt = new THREE.TextureLoader().load('./img/X1.png')
    const counts = 15625; // or any number
    
    const numPerAxis = Math.ceil(Math.cbrt(counts))
    const gap        = 0.1
    const mid        = (numPerAxis - 1) / 2

    const { positions } = useMemo(() => {
        console.log( mid, numPerAxis )
        const pos = new Float32Array(counts * 3);

        let i = 0;
        for (let x = 0; x < numPerAxis; x++) {
            for (let y = 0; y < numPerAxis; y++) {
                for (let z = 0; z < numPerAxis; z++) {
                    if (i >= counts) break;

                    const dx = x - mid
                    const dy = y - mid
                    const dz = z  - mid


                    // inside your triple loop…
                    const ty  = Math.abs(dy) / mid   // 0 at center, 1 at top/bottom edge
                    const tx  = Math.abs(dx) / mid   // 0 at center, 1 at back/front edge
                    const tz  = Math.abs(dz) / mid   // 0 at center, 1 at side/side edge

                    // linear growth: gaps smallest at center, largest at edges
                    // const factor = t              
                    const factorx = Math.sin(tx * Math.PI * 0.5)
                    const factory = Math.sin(ty * Math.PI * 0.5)
                    const factorz = Math.sin(tz * Math.PI * 0.5)

                    pos[i*3 + 0] = dx * gap * factory
                    pos[i*3 + 1] = dy * gap * factorx
                    pos[i*3 + 2] = dz * gap * (factorx + factory)

                    i++

                }
            }
        }

        return { positions: pos };
    }, [counts, numPerAxis, gap, mid]);


    const { colors } = useMemo(() => {

        const clrs = new Float32Array(counts * 3);

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
   
                    i++;
                }
            }
        }
        return { colors: clrs };
    },[counts, numPerAxis, gap, mid])

    useEffect(() => {
        if(meshRef.current) {
            console.log(meshRef.current)
        }
    },[meshRef])

    const initRef = useRef()
    if (!initRef.current) initRef.current = positions.slice()

    useFrame(({ clock }) => {
        const t       = clock.getElapsedTime()
        const posArr  = meshRef.current.geometry.attributes.position.array
        const init    = initRef.current   // your frozen Float32Array
        const count   = init.length / 3
        const freq    = 2.5               // flap speed
        const maxAngle = Math.PI / 6      // ±30°

        for (let i = 0; i < count; i++) {
            const j  = 3 * i
            const x0 = init[j]
            const y0 = init[j + 1]
            const z0 = init[j + 2]

            // 1) Build the hinge-axis: perpendicular to the diagonal direction in XZ
            //    (dx, dz) --> axis = ( dz, 0, -dx ), normalized
            const dx = x0
            const dz = z0
            const axis = new THREE.Vector3(dz, 0, -dx).normalize()

            // 2) Compute flap angle
            //    All prongs use the same sin, but you can offset per wing with +π for two wings if desired
            const flap = Math.sin(t * freq) * maxAngle

            // 3) Quaternion for rotation around that axis
            const q = new THREE.Quaternion().setFromAxisAngle(axis, flap)

            // 4) Apply to original point
            const p = new THREE.Vector3(x0, y0, z0).applyQuaternion(q)

            // 5) Write back
            posArr[j]     = p.x
            posArr[j + 1] = p.y
            posArr[j + 2] = p.z
        }

        meshRef.current.geometry.attributes.position.needsUpdate = true
    })



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
                    size={0.05}
                    sizeAttenuation
                    map={txt}
                    depthWrite={true}
                    alphaTest={0.5}
                    // transparent
                    shadowSide={THREE.DoubleSide}
                    // alphaHash
                />
            </points>
        </>
    )
}
const HTML8 = () => {
    return (
        <div className='html-canvas'>
            <Canvas>
                <Scene samples={6} />
                <OrbitControls/>
            </Canvas>
        </div>
    )
}

export default HTML8