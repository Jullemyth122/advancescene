import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import React, { useEffect, useMemo, useRef } from 'react'

const followerStyle = { background: 'linear-gradient(#1a1a1a, #212735)', width: '100vw', height: '100vh', overflow: 'hidden' }
const canvasStyle = { display: 'block', width: '100%', height: '100%' }

// Camera follows the curve but mouse controls the camera's *orientation* (yaw/pitch)
// relative to the camera's forward direction. The mouse can look all around
// including looking down. When you stop moving the mouse the view eases back
// to the default (a point slightly ahead on the curve) smoothly — no OrbitControls.

const Scene = ({
  radius = 5,
  turns = 10,
  segments = 100,
  height = 100,
  stairStep = 0.01,
  speed = 0.02,
  offset = 5,
}) => {
  const lineRef = useRef()
  const mouseRef = useRef(new THREE.Vector2(0, 0))
  const lastMoveRef = useRef(performance.now())

  // Track pointer inside the canvas for correct aspect mapping
  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      // normalized to -1..1, with y positive up
      mouseRef.current.x = x * 2 - 1
      mouseRef.current.y = -(y * 2 - 1)
      lastMoveRef.current = performance.now()
    }

    canvas.addEventListener('pointermove', onMove)
    return () => canvas.removeEventListener('pointermove', onMove)
  }, [])

  const { positions, colors, curve } = useMemo(() => {
    const posArr = []
    const colArr = []
    const points = []

    const totalPoints = segments + 1
    const angleStep = (Math.PI * 2 * turns) / segments

    for (let i = 0; i < totalPoints; i++) {
      const angle = i * angleStep
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)

      let y = (i / segments) * height
      if (stairStep > 0) y = Math.floor(y / stairStep) * stairStep

      posArr.push(x, y, z)
      points.push(new THREE.Vector3(x, y, z))

      const t = i / segments
      const r = 0.2 + 0.8 * (1 - t), g = 0.8 * t, b = 0.9 - 0.6 * t
      colArr.push(r, g, b)
    }

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)

    return {
      positions: new Float32Array(posArr),
      colors: new Float32Array(colArr),
      curve,
    }
  }, [radius, turns, segments, height, stairStep])

  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors linewidth={2} />
      </line>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[radius - 0.01, radius + 0.01, 64]} />
        <meshBasicMaterial transparent opacity={0.08} />
      </mesh>

      <CameraController curve={curve} speed={speed} offset={offset} mouseRef={mouseRef} lastMoveRef={lastMoveRef} />
    </group>
  )
}

function CameraController({ curve, speed = 0.02, offset = 5, mouseRef, lastMoveRef }) {
  const { camera } = useThree()
  const tRef = useRef(0)

  // current yaw/pitch (radians)
  const curYaw = useRef(0)
  const curPitch = useRef(0)

  // parameters
  const maxYaw = Math.PI * 0.5 // 90 degrees left/right
  const maxPitch = Math.PI * 0.6 // ~108 degrees up/down (clamped)
  const returnDelay = 0.6 // seconds to wait before returning
  const returnSpeed = 2.5 // how quickly yaw/pitch return to zero
  const smooth = 0.12 // camera position smoothing
  const lookSmooth = 0.12 // look smoothing

  useFrame((_, delta) => {
    tRef.current = (tRef.current + speed * delta) % 1
    const t = tRef.current

    const point = curve.getPointAt(t)

    // update camera position along path (radial offset + small up)
    const radial = new THREE.Vector3(point.x, 0, point.z)
    if (radial.lengthSq() < 1e-6) radial.set(1, 0, 0)
    radial.normalize()
    const upOffset = new THREE.Vector3(0, 1.5, 0)
    const camPos = new THREE.Vector3().copy(point).add(radial.multiplyScalar(offset)).add(upOffset)
    camera.position.lerp(camPos, smooth)

    // base lookAt: the current point on the curve (looking inward at the spiral)
    const aheadT = t % 1
    const baseLookAt = curve.getPointAt(aheadT)

    // compute mouse-derived target yaw/pitch
    const m = mouseRef?.current || new THREE.Vector2(0, 0)
    // map mouse -1..1 to yaw/pitch range
    const targetYaw = m.x * maxYaw
    // invert y so moving mouse down looks down
    const targetPitch = -m.y * maxPitch

    // determine if we should decay back to zero (idle)
    const now = performance.now()
    const secondsSinceMove = (now - (lastMoveRef?.current || now)) / 1000
    let influence = 1.0
    if (secondsSinceMove > returnDelay) {
      // compute decay factor (ease back to zero)
      const decay = Math.max(0, 1 - (secondsSinceMove - returnDelay) * returnSpeed)
      influence = decay
    }

    // desired yaw/pitch after applying influence
    const desiredYaw = targetYaw * influence
    const desiredPitch = targetPitch * influence

    // lerp current yaw/pitch toward desired
    curYaw.current = THREE.MathUtils.lerp(curYaw.current, desiredYaw, Math.min(1, delta * 8) * 0.8)
    curPitch.current = THREE.MathUtils.lerp(curPitch.current, desiredPitch, Math.min(1, delta * 8) * 0.8)

    // clamp pitch to avoid flipping
    curPitch.current = Math.max(-maxPitch, Math.min(maxPitch, curPitch.current))

    // compute rotated forward vector from base (baseLookAt - camera)
    const forward = new THREE.Vector3().subVectors(baseLookAt, camera.position).normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
    const up = new THREE.Vector3().crossVectors(right, forward).normalize()

    // build quaternion: yaw around world up, pitch around camera right
    const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), curYaw.current)
    const qPitch = new THREE.Quaternion().setFromAxisAngle(right, curPitch.current)

    const rotated = forward.clone().applyQuaternion(qYaw).applyQuaternion(qPitch).normalize()

    // set look point some distance along rotated vector
    const dist = new THREE.Vector3().subVectors(baseLookAt, camera.position).length()
    const lookPoint = new THREE.Vector3().copy(camera.position).add(rotated.multiplyScalar(dist))

    // smoothly look at the computed lookPoint
    // We can't lerp camera.lookAt directly, so compute a temporary target and slerp camera quaternion
    const m1 = new THREE.Matrix4().lookAt(camera.position, lookPoint, new THREE.Vector3(0, 1, 0))
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m1)
    camera.quaternion.slerp(targetQuat, lookSmooth)

    camera.up.lerp(new THREE.Vector3(0, 1, 0), 0.08)
  })

  return null
}

const Follower3 = () => {
  return (
    <div className="follower" style={followerStyle}>
      <Canvas
        style={canvasStyle}
        gl={{ antialias: true }}
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [12, 6, 12], fov: 50 }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={0.6} />
        <Scene />
      </Canvas>
    </div>
  )
}

export default Follower3