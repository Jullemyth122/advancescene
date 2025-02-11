import { MeshReflectorMaterial, OrbitControls, useMask } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React, { useEffect } from 'react'
import './mirrorself.scss'
import * as THREE from 'three'

function MaskedContent({ invert, ...props }) {
    /* The useMask hook has to refer to the mask id defined below, the content
     * will then be stamped out.
     */
  
    const stencil = useMask(1, invert)
    // const group = useRef()
    // useFrame((state) => (group.current.rotation.y = state.clock.elapsedTime / 2))
    return (
        <group {...props}>
            <mesh position={[-1, 1, -4.5]}>
            <boxGeometry args={[1.5,1.5,1.5]} />
            <meshStandardMaterial {...stencil} color={'gray'} />
            </mesh>
            <mesh position={[1, 1, -4.5]}>
            <sphereGeometry args={[0.8, 64, 64]} />
            <meshStandardMaterial {...stencil} color={'gray'} />
            </mesh>
            
            <mesh position={[1, 1.5, -6]}>
            <coneGeometry args={[2, 4, 32]} />
            <meshStandardMaterial {...stencil} color={'gray'} />
            </mesh>

            <mesh position={[-2, 1.5, -7.5]}>
            <cylinderGeometry args={[1, 1, 5,32]} />
            <meshStandardMaterial {...stencil} color={'gray'} />
            </mesh>

            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0 ,0]}>
            <planeGeometry args={[50,50]} />
            <MeshReflectorMaterial {...stencil}  
                    // color={'gray'} 
                    color={'gray'}
                    roughness={0.4}
                    metalness={0.7}
                    flatShading={true}
                    opacity={1}
                    mixBlur={2}
                    resolution={1024}
                    mirror={0}
                    side={THREE.DoubleSide}
                    reflectorOffset={0.2}
            />
            </mesh>
            <mesh position={[0, 0, -25]} 
                rotation={[ - Math.PI , 0 , 0 ]}
            >
            <planeGeometry args={[50,50]} />
            <MeshReflectorMaterial {...stencil}  
                    // color={'gray'} 
                    color={'gray'}
                    roughness={0.4}
                    metalness={0.7}
                    flatShading={true}
                    opacity={1}
                    mixBlur={2}
                    resolution={1024}
                    mirror={0}
                    side={THREE.DoubleSide}
                    reflectorOffset={0.2}
            />
            </mesh>

        </group>
    )
}

const Scene = ({
        color = "white",
        thickness = 2,
        roughness = 0.65,
        envMapIntensity = 1,
        transmission = 0,
        metalness = 0,
        ...props
    }) => {

    const material = { 
        color,
        thickness,
        roughness,
        envMapIntensity,
        transmission,
        metalness
    }

    return (
        <>
            <ambientLight color="#579934" intensity={1.1} />
            
            <directionalLight
                castShadow
                position={[0, 2, 1]}
                color={"#FFCD9E"}
                intensity={5}
                shadow-mapSize={2048}
                shadow-camera-top={10}
                shadow-camera-right={10}
                shadow-camera-bottom={-10}
                shadow-camera-left={-10}
            />

            {/* <pointLight
                color={"#ffd200"}
                intensity={0.24}
                position={[2, 1, 2]}
            /> */}
            {/* <mesh position={[0,0,0]} rotation={[0,0,0]} castShadow>
                <boxGeometry args={[2,2,2]}></boxGeometry>
                <meshPhysicalMaterial 
                {...material} 
                />
            </mesh>

            <mesh position={[0,-2,0]} rotation={[-Math.PI / 2,0,0]}>
                <planeGeometry
                    args={[5,5,32,32]}
                />
                <meshPhysicalMaterial 
                {...material} 
                side={THREE.DoubleSide}
                />
            </mesh> */}

            <MaskedContent invert={false} />

        </>
    )
}

const MirrorSelf = () => {



    useEffect(() => {
        return () => {
        
        }
    }, [

    ])
    

    return (
        <div className='mirror-comp'>
        <Canvas
            className="three-canvas"
            flat
            gl={{ antialias: true }}
            camera={{ position: [0, 0, 2] }}
        >
            <pointLight position={[10, 10, 10]} />
            <Scene />
            <OrbitControls />
        </Canvas>
                    
        </div>
    )
}

export default MirrorSelf