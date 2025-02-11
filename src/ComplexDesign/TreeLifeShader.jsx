import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const TreeShader = () => {
  const materialRef = useRef()

  // Define uniforms for time (for animation) and resolution (if needed)
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  }), [])

  // Update time uniform every frame to drive animation in the shader
  useFrame((state, delta) => {
    uniforms.u_time.value += delta
  })

  // A simple vertex shader: pass through position and uv
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  // A fragment shader that “draws” a tree-like fractal pattern.
  // This example is very basic—it creates an effect by iteratively
  // modifying the uv coordinates. In a more advanced shader you might
  // implement raymarching or fractal functions to simulate detailed branches.
  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 vUv;

    // A simple iterative function to simulate branching structure.
    // (This is only an illustrative example.)
    float treePattern(vec2 uv) {
      float n = 0.0;
      vec2 p = uv * 2.0 - 1.0; // remap uv to [-1,1]
      float scale = 1.0;
      for (int i = 0; i < 10; i++){
        p = abs(p) - vec2(0.2, 0.3);
        scale *= 1.5;
        n += length(p) / scale;
      }
      return n;
    }

    void main(){
      vec2 uv = vUv;
      // Add a small animation effect
      uv.y += sin(uv.x * 10.0 + u_time * 0.5) * 0.05;
      
      // Get a value from our iterative function to mimic branch density/structure
      float pattern = treePattern(uv);

      // Mix colors based on the pattern value to simulate trunk and foliage.
      // Adjust these colors and thresholds to refine the look.
      vec3 trunkColor = vec3(0.2, 0.1, 0.0);
      vec3 leafColor = vec3(0.0, 0.5, 0.0);
      vec3 color = mix(trunkColor, leafColor, smoothstep(0.3, 0.7, pattern));
      
      gl_FragColor = vec4(color, 1.0);
    }
  `

  return (
    <mesh>
      <planeBufferGeometry args={[4, 4]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default function TreeLifeShader() {
    return (
        <div className="mirror-comp">
            <Canvas
            className='three-canvas'
            style={{ background: 'black' }}
            camera={{ position: [0, 0, 5] }}
            >
            <TreeShader />
            </Canvas>
        </div>
    )
}
