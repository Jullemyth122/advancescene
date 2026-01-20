import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// import React from 'react'
import './html.scss'
import { OrbitControls } from '@react-three/drei'

const Scene = ({ amount = 6 }) => {
    
    const meshRef = useRef()
    const spotRef = useRef()
    const { gl, scene, camera, size } = useThree()

    useEffect(() => {
        camera.lookAt(0,0,0)
        if (spotRef.current) {
            // OPTION A: orient the light directly
            spotRef.current.lookAt(0, 0, 0)
            // OPTION B (more “correct” for SpotLight): move its target to the origin
            spotRef.current.target.position.set(0, 0, 0)
            // make sure the target is in the scene so Three.js will update it
            scene.add(spotRef.current.target)
        }
    },[])

    return(
        <>
            <ambientLight intensity={1.} color="#ffffff" />
            {/* <directionalLight
                color={0x6176ff}
                position={[0.,1.,3.]}
                intensity={10}
                castShadow
                shadow-bias={-0.001}
                shadow-camera-zoom={4}
            /> */}
            <spotLight
                ref={spotRef}
                color={0x61b0ff}
                // color={0xffffff}     // now white
                intensity={500}
                position={[20., 10, 20]}
                angle={Math.PI / 3}         // wider cone
                distance={0}                // 0 = infinite reach
                decay={2}                   // inverse-square falloff
                penumbra={0.2}
                castShadow
                shadow-camera-fov={90}      // widen the shadow frustum
                shadow-camera-near={1}
                shadow-camera-far={100}
            />
            <mesh receiveShadow position={[0, 0, -1]} rotation={[-Math.PI / 2,0 ,0]}>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial roughness={0.5} metalness={0} color="#fff" side={THREE.DoubleSide} />
            </mesh>            

        </>
    )
}

const HTML3 = () => {
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

export default HTML3