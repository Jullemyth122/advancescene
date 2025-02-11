import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import React, { useRef } from 'react'
import * as THREE from 'three'
import './mirrorself.scss'

const Scene = () => {

    const spotLightRef = useRef()
    const spotLightRef2 = useRef()
    const spotLightRef3 = useRef()

    const boxRef = useRef()
    
    const textureLight = useLoader(THREE.TextureLoader, "./img/samp1.jpg")
    const textureLight2 = useLoader(THREE.TextureLoader, "./img/samp2.jpg")

    useFrame(() => {
        if (spotLightRef.current && spotLightRef2.current && spotLightRef3.current) {
            // Continuously rotate the light around the Y and X axis

            const time = performance.now() / 3000;

            spotLightRef.current.position.x = Math.cos( time ) * 2.5;
            spotLightRef.current.position.z = Math.sin( time ) * 2.5;
            
            spotLightRef2.current.position.x = -Math.sin( time ) * 2.5;
            spotLightRef2.current.position.z = -Math.cos( time ) * 2.5;
            
            spotLightRef3.current.position.z = Math.tan( time * 5 ) * 2.5;
            //   spotLightRef3.current.position.y = Math.cos( time ) * 2.5;

            // boxRef.current.position.z = Math.cos( time ) * 5;            
            // boxRef.current.position.x = Math.sin( time ) * 5;            

        }
    });

    
    return(
        <>
            <ambientLight color="#fff" intensity={1} castShadow />
            <spotLight
                ref={spotLightRef}
                color={0xffffff}
                position={[26,15,26]}
                penumbra={1}
                decay={2}
                distance={200}
                map={textureLight}
                castShadow={true}
                intensity={1000}
                shadow-camera-near={1}
                shadow-camera-far={10}
                shadow-mapSize={2048}
                shadow-bias={-0.003}
                shadow-focus={1}
                shadow-camera-top={10}
                shadow-camera-right={10}
                shadow-camera-bottom={-10}
                shadow-camera-left={-10}               
            ></spotLight>
            <spotLight
                ref={spotLightRef2}
                color={0xffffff}
                position={[26,20,26]}
                penumbra={1}
                decay={2}
                distance={200}
                map={textureLight}
                castShadow={true}
                intensity={1000}
                shadow-camera-near={1}
                shadow-camera-far={10}
                shadow-mapSize={2048}
                shadow-camera-top={10}
                shadow-camera-right={10}
                shadow-camera-bottom={-10}
                shadow-camera-left={-10}
                shadow-bias={-0.003}
                shadow-focus={1}
            ></spotLight>
            <spotLight
                ref={spotLightRef3}
                color={0xffffff}
                position={[26,20,26]}
                penumbra={1}
                decay={2}
                distance={200}
                map={textureLight2}
                castShadow={true}
                intensity={1000}
                shadow-camera-near={1}
                shadow-camera-far={10}
                shadow-mapSize={2048}
                shadow-camera-top={10}
                shadow-camera-right={10}
                shadow-camera-bottom={-10}
                shadow-camera-left={-10}
                shadow-bias={-0.003}
                shadow-focus={1}
            ></spotLight>


            <mesh position={[0,0,0]} rotation={[-Math.PI /2 ,0 ,0]} receiveShadow={true} castShadow={true}>
            <planeGeometry args={[50,50]} />
                <meshStandardMaterial   
                    roughness={0.7}
                    metalness={0.5}
                    flatShading 
                    color={0xffffff}
                    shadowSide={THREE.DoubleSide}
                    side={THREE.DoubleSide}
                />
            </mesh>   

            <mesh ref={boxRef} position={[0, 2, 0]} rotation={[-Math.PI / 2, Math.PI / 3, 0]} castShadow={true} receiveShadow={true}>
            `<boxGeometry args={[3,3,2]} />
                <meshStandardMaterial   
                    roughness={0.7}
                    metalness={0.5}
                    flatShading 
                    color={0xffffff}
                    shadowSide={THREE.DoubleSide}
                    side={THREE.DoubleSide}
                />
            </mesh>   


        </>
    )
}

const SpotLights = () => {

    return (
        <div className='mirror-comp'>
        <Canvas
            shadows
            className="three-canvas"
            flat
            gl={{ antialias: true }}
            camera={{ position: [-3, 5, -3] }}
        >
            <pointLight position={[10, 10, 10]} />
            <Scene />
            <OrbitControls />
        </Canvas>
                    
        </div>
    )
}

export default SpotLights