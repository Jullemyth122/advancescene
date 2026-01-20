import React, { useEffect, useMemo, useRef } from 'react'
import './html.scss'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import * as THREE from 'three'

// extend({ ArrayCamera: THREE.ArrayCamera, Vector4: THREE.Vector4 })


const Scene = ({ amount = 6 }) => {

    const meshRef = useRef()
    const { gl, size, scene} = useThree()
    const pointer = useRef({ x: 0, y: 0 })

    const subCameras = useMemo(() => {
        const cams = []
        for (let i = 0; i < amount * amount; i++) {
            const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 10)
            cam.viewport = new THREE.Vector4()
            cams.push(cam)
            
        }
        return cams
    }, [amount])

    const arrayCamera = useMemo(() => {
        const ac = new THREE.ArrayCamera(subCameras)
        ac.position.z = 3
        return ac
    }, [ subCameras ])

    useEffect(() => {
        const update = () => {
            const ASPECT = size.width / size.height
            const W = size.width / amount
            const H = size.height / amount
            arrayCamera.aspect = ASPECT
            arrayCamera.updateProjectionMatrix()

            subCameras.forEach((sub, idx) => {
                const x = idx % amount
                const y = Math.floor(idx / amount)
                sub.copy(arrayCamera)
                    sub.viewport.set(
                    Math.floor(x * W),
                    Math.floor((amount - 1 - y) * H),
                    Math.ceil(W),
                    Math.ceil(H)
                )
                sub.position.set(
                    (x / amount) - 0.5,
                    0.5 - (y / amount),
                    1.5 + ((x + y) * 0.5)
                ).multiplyScalar(2)
                sub.lookAt(0, 0, 0)
                sub.updateMatrixWorld()
            })
        }

        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [size, amount, arrayCamera, subCameras])

    useEffect(() => {
        const handleMouseMove = (event) => {
            pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
            pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])


    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.005
            meshRef.current.rotation.z += 0.01
        }
        // gl.render(scene, arrayCamera)

        const targetX = pointer.current.x * 2
        const targetY = pointer.current.y * 2

        arrayCamera.position.x += (targetX - arrayCamera.position.x) * 0.05
        arrayCamera.position.y += (targetY - arrayCamera.position.y) * 0.05
        arrayCamera.lookAt(0, 0, 0)
        arrayCamera.updateMatrixWorld()

        subCameras.forEach((sub) => {
            sub.quaternion.copy(arrayCamera.quaternion)
            sub.updateMatrixWorld()
        })

        gl.render(scene, arrayCamera)
    }, 1)


    return(<>
        <ambientLight/>
        <directionalLight
            color={0xfaaaaa}
            position={[0., 0., 0.5]}
            intensity={3}
            castShadow
            shadow-bias={-0.001}
            shadow-camera-zoom={4}
        />
        <spotLight
            color={0x6432a8}
            intensity={10}
            position={[0.1, 1, 0.5]}
            angle={Math.PI / 4}
            penumbra={0.2}
            castShadow
        />
        <mesh receiveShadow position={[0, 0, -1]}>
            <planeGeometry args={[100, 100]} />
            <meshPhongMaterial color="#00bcaa" />
        </mesh>
        <mesh ref={meshRef} castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            <meshPhongMaterial color="#000" />
        </mesh>
        {/* <Stats /> */}
            

    </>)
}

const HTML2 = () => {
    return (
        <div className='html-canvas'>
            <Canvas
                gl={{ antialias: true }}
                shadows
                dpr={[1,2]}
            >
                <Scene amount={2}/>
                <OrbitControls/>
            </Canvas>
        </div>
    )
}

export default HTML2