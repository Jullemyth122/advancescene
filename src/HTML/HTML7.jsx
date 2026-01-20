import React, { useLayoutEffect, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import "./html.scss"

// ————————————————————————————————————————————————————————————
// GLSL
// ————————————————————————————————————————————————————————————

const vertexShader = /* glsl */`
  attribute float aDelay;       // per-instance reveal delay
  uniform float u_time;
  uniform float u_duration;     // how long each cube takes to pop
  uniform float u_speed;        // wave speed
  varying float vPhase;         // normalized [0..1]
  varying vec3  vColor;

  attribute vec3 color;

  void main(){
    // compute time since this cube’s turn
    float t = u_time - aDelay;
    // normalize into [0,1] over u_duration
    vPhase = clamp(t / u_duration, 0.0, 1.0);

    // rising: from Y=0→Y=gap, with a little overshoot
    float rise = sin(vPhase * 3.14159) * 0.5; 

    vec3 pos = position.xyz;
    pos.y += rise;

    // scale pop
    float s = mix(0.5, 1.0, vPhase);
    vec4 worldPos = instanceMatrix * vec4(pos * s, 1.0);

    vColor = color;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const fragmentShader = /* glsl */`
  varying float vPhase;
  varying vec3  vColor;
  void main(){
    // flash from blue→yellow in the first half of the pop
    vec3 flash = mix(vec3(0.0,0.0,1.0), vec3(1.0,1.0,0.0), smoothstep(0.0, 0.5, vPhase));
    // then blend into your gradient color
    vec3 c = mix(flash, vColor, smoothstep(0.5, 1.0, vPhase));
    gl_FragColor = vec4(c, 1.0);
  }
`

// ————————————————————————————————————————————————————————————
// React Component
// ————————————————————————————————————————————————————————————

function ShelterWave({ 
  gridSize = 20,       // N×N grid
  gap = 0.25,           // spacing
  duration = 0.6,      // each cube’s pop time
  waveSpeed = 2.5      // speed of ripple
}) {
  const count = gridSize * gridSize
  const mesh  = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // 1) build attributes
  const { positions, delays, colors } = useMemo(() => {
    const posArr = new Float32Array(count * 3)
    const delArr = new Float32Array(count)
    const colArr = new Float32Array(count * 3)

    const mid = (gridSize - 1) / 2
    // maximum distance from center
    const maxD = Math.hypot(mid, mid)

    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const i = x * gridSize + z
        // position on XZ plane
        const px = (x - mid) * gap
        const pz = (z - mid) * gap
        posArr[i*3+0] = px
        posArr[i*3+1] = 0
        posArr[i*3+2] = pz

        // compute delay = distance → time offset
        const d = Math.hypot(x-mid, z-mid) / maxD
        delArr[i] = d * waveSpeed

        // color gradient by Z (or Y if you prefer)
        const t = z / (gridSize - 1)
        const col = new THREE.Color().setHSL(
          (1-t)*(220/360) + t*(60/360),
          1.0,
          (1-t)*0.3 + t*0.7
        )
        colArr[i*3+0] = col.r
        colArr[i*3+1] = col.g
        colArr[i*3+2] = col.b
      }
    }

    return { positions: posArr, delays: delArr, colors: colArr }
  }, [gridSize, gap, waveSpeed, count])

  // 2) geometry + instanced attributes
  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25)
    geo.setAttribute("aDelay",    new THREE.InstancedBufferAttribute(delays, 1))
    geo.setAttribute("color",     new THREE.InstancedBufferAttribute(colors, 3))
    return geo
  }, [delays, colors])

  // 3) set matrices
  useLayoutEffect(() => {
    if (!mesh.current) return
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i*3], positions[i*3+1], positions[i*3+2]
      )
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [positions, count, dummy])

  // 4) uniforms & animation
  const uniforms = useMemo(() => ({
    u_time:     { value: 0 },
    u_duration: { value: duration },
    u_speed:    { value: waveSpeed }
  }), [duration, waveSpeed])

  useFrame(({ clock }) => {
    uniforms.u_time.value = clock.getElapsedTime()
  })

  return (
    <instancedMesh ref={mesh} args={[geometry, null, count]} frustumCulled={false}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={true}
        transparent
      />
    </instancedMesh>
  )
}

export default function HTML7() {
  return (
    <div className="html-canvas">
      <Canvas camera={{ position: [0, 5, 5], fov: 50 }} dpr={[1,2]}>
        <ambientLight intensity={0.8} />
        <ShelterWave />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
