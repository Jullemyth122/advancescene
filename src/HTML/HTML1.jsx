// HTML1.jsx
import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import './html.scss'

function Lines() {
    const lineRef = useRef()
    const { camera, size } = useThree()
    const [drawCount, setDrawCount] = useState(0)

    // 1️⃣ Build full pts array
    const { positions, colors, maxPoints } = useMemo(() => {
        const raw = [
            new THREE.Vector3(-5,0,-5), new THREE.Vector3(-5,0,0),
            new THREE.Vector3(-5,5,0), new THREE.Vector3(-5,5,-5),
            new THREE.Vector3(5,5,-5), new THREE.Vector3(5,5,0),
            new THREE.Vector3(5,0,0), new THREE.Vector3(5,0,-5),
            new THREE.Vector3(-10,0,-10), new THREE.Vector3(-10,0,0),
            new THREE.Vector3(-10,10,0), new THREE.Vector3(-10,10,-10),
            new THREE.Vector3(10,10,-10), new THREE.Vector3(10,10,0),
            new THREE.Vector3(10,0,0), new THREE.Vector3(10,0,-10),
            new THREE.Vector3(-15,0,-15), new THREE.Vector3(-15,0,0),
            new THREE.Vector3(-15,15,0), new THREE.Vector3(-15,15,-15),
            new THREE.Vector3(15,15,-15), new THREE.Vector3(15,15,0),
            new THREE.Vector3(15,0,0), new THREE.Vector3(15,0,-15),
            new THREE.Vector3(-20,0,-20), new THREE.Vector3(-20,0,0),
            new THREE.Vector3(-20,20,0), new THREE.Vector3(-20,20,-20),
            new THREE.Vector3(20,20,-20), new THREE.Vector3(20,20,0),
            new THREE.Vector3(20,0,0), new THREE.Vector3(20,0,-20),
            new THREE.Vector3(-25,0,-25), new THREE.Vector3(-25,0,0),
            new THREE.Vector3(-25,25,0), new THREE.Vector3(-25,25,-25),
            new THREE.Vector3(25,25,-25), new THREE.Vector3(25,25,0),
            new THREE.Vector3(25,0,0), new THREE.Vector3(25,0,-25),
            new THREE.Vector3(-30,0,-30), new THREE.Vector3(-30,0,0),
            new THREE.Vector3(-30,30,0), new THREE.Vector3(-30,30,-30),
            new THREE.Vector3(30,30,-30), new THREE.Vector3(30,30,0),
            new THREE.Vector3(30,0,0), new THREE.Vector3(30,0,-30),
        ]
        const pts = raw
        const pos = new Float32Array(pts.length * 3)
        const col = new Float32Array(pts.length * 3)
        const c = new THREE.Color()
        pts.forEach((p,i) => {
            pos.set([p.x,p.y,p.z], i*3)
            const t = i/pts.length
            c.setHSL(0.6, 1, 0.5 + 0.5*t)
            col.set([c.r,c.g,c.b], i*3)
        })
        return { positions: pos, colors: col, maxPoints: pts.length }
    }, [])

    // 2️⃣ Set initial drawRange once
    useEffect(() => {
        lineRef.current.geometry.setDrawRange(0, 0)
    }, [])

    // 3️⃣ Animate growth & camera
    const pointer = useRef({ x: 0, y: 0 })
    useFrame(() => {
        if (drawCount < maxPoints) {
            setDrawCount((c) => c + 1)
            lineRef.current.geometry.setDrawRange(0, drawCount)
        }
        // smooth follow
        const ease = 0.05
        camera.position.x += (pointer.current.x * 0.05 - camera.position.x) * ease
        camera.position.y += (-pointer.current.y * 0.05 - camera.position.y) * ease
        camera.lookAt(0,0,0)
    })

    // 4️⃣ Resize camera on window changes
    useEffect(() => {
        camera.aspect = size.width / size.height
        camera.updateProjectionMatrix()
    }, [size, camera])

    // track pointer
    useEffect(() => {
        const onMove = (e) => {
            pointer.current.x = e.clientX - size.width / 2
            pointer.current.y = e.clientY - size.height / 2
        }
        window.addEventListener('pointermove', onMove)
        return () => window.removeEventListener('pointermove', onMove)
    }, [size])

    return (
        <line ref={lineRef} scale={[0.45,0.45,0.45]}>
            <bufferGeometry>
                <bufferAttribute
                attach="attributes-position"
                array={positions}
                itemSize={3}
                count={positions.length/3}
                />
                <bufferAttribute
                attach="attributes-color"
                array={colors}
                itemSize={3}
                count={colors.length/3}
                />
            </bufferGeometry>
            <lineBasicMaterial vertexColors />
        </line>
    )
}

export default function HTML1() {
    return (
        <div className="html-canvas">
        <Canvas
            gl={{ antialias: true }}
            camera={{ position: [0,10,50], fov: 33, near: 1, far: 10000 }}
        >
            <ambientLight />
            <Lines />
        </Canvas>
        </div>
    )
}
