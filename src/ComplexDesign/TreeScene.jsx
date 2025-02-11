import React, { Suspense, useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, shaderMaterial, Html } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { KernelSize } from 'postprocessing';


// ===================================================================
// Bark Shader Material – similar to your example for the trunk
// ===================================================================
const BarkShaderMaterial = shaderMaterial(
  { barkColor: new THREE.Color("#8B4513"), noiseScale: 5.0 },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 barkColor;
    uniform float noiseScale;
    varying vec2 vUv;
    
    // Simplex noise functions by Ashima Arts
    vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187,  0.366025403784439, -0.577350269189626,  0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      vec3 p = permute( permute(i.y + vec3(0.0, i1.y, 1.0))
                      + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
         g.x = a0.x  * x0.x + h.x  * x0.y;
         g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main(){
      float n = snoise(vUv * noiseScale);
      float factor = smoothstep(-0.5, 0.5, n);
      vec3 color = mix(barkColor * 0.8, barkColor * 1.2, factor);
      gl_FragColor = vec4(color, 1.0);
    }
  `
);
extend({ BarkShaderMaterial });

// ===================================================================
// Blooming Leaf Shader Material – canopy shader with blooming (glow) effect
// ===================================================================
const BloomingLeafShaderMaterial = shaderMaterial(
  {
    leafColor: new THREE.Color("#228B22"),
    bloomColor: new THREE.Color("#FFFF99"),
    noiseScale: 3.0,
    time: 0,
  },
  // Vertex Shader: pass UV coordinates
  `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader: add noise and time-based pulsing bloom effect
  `
    uniform vec3 leafColor;
    uniform vec3 bloomColor;
    uniform float noiseScale;
    uniform float time;
    varying vec2 vUv;
    
    // Simplex noise functions
    vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      vec3 p = permute( permute(i.y + vec3(0.0, i1.y, 1.0))
                      + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
         g.x = a0.x  * x0.x + h.x  * x0.y;
         g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main(){
      // Animate the noise with time to create a pulsing effect
      float n = snoise(vUv * noiseScale + time * 0.1);
      float factor = smoothstep(-0.3, 0.3, n);
      
      // Base color with subtle variation
      vec3 color = mix(leafColor * 0.9, leafColor * 1.1, factor);
      
      // Calculate bloom intensity based on noise and a pulsing threshold
      float bloomIntensity = smoothstep(0.25, 0.5, factor + sin(time * 2.0) * 0.1);
      color = mix(color, bloomColor, bloomIntensity);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
);
extend({ BloomingLeafShaderMaterial });

// ===================================================================
// Blooming Tree Component – trunk with bark and canopy with blooming leaves
// ===================================================================
function BloomingTree({ position = [0, 0, 0] }) {
  // Tree dimensions
  const trunkHeight = 5.0;
  const trunkRadius = 0.3;
  const canopyRadius = 2.5;

  // Reference to update time uniform in the blooming leaf material
  const bloomingRef = useRef();
  useFrame(({ clock }) => {
    if (bloomingRef.current) {
      bloomingRef.current.time = clock.getElapsedTime();
    }
  });

  return (
    <group position={position}>
      {/* Trunk with bark shader */}
      <mesh position={[0, trunkHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[trunkRadius, trunkRadius, trunkHeight, 32]} />
        <barkShaderMaterial barkColor={new THREE.Color("#8B4513")} noiseScale={5.0} />
      </mesh>
      {/* Canopy with blooming leaves shader */}
      <mesh position={[0, trunkHeight, 0]} castShadow receiveShadow>
        <sphereGeometry args={[canopyRadius, 32, 32]} />
        <bloomingLeafShaderMaterial
          ref={bloomingRef}
          leafColor={new THREE.Color("#228B22")}
          bloomColor={new THREE.Color("#FFFF99")}
          noiseScale={3.0}
          time={0}
        />
      </mesh>
    </group>
  );
}

// ===================================================================
// Forest Component – arrange many trees
// ===================================================================
function BloomingForest() {
  const trees = [];
  const count = 30; // adjust as needed
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    trees.push(<BloomingTree key={i} position={[x, 0, z]} />);
  }
  return <group>{trees}</group>;
}

// ===================================================================
// Cosmic Background Component – set a space-like background
// ===================================================================
function CosmicBackground() {
  const { scene } = useThree();
  scene.background = new THREE.Color("#000010");
  return null;
}

// ===================================================================
// Main Scene – includes the forest, lighting, and postprocessing bloom
// ===================================================================
function UniverseOfBloomingTreesScene() {
  return (
    <div className="mirror-comp">
      <Canvas className="three-canvas" camera={{ position: [0, 8, 20], fov: 60 }} shadows>
        <Suspense fallback={<Html center>Loading...</Html>}>
          <CosmicBackground />
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
          <BloomingForest />
          {/* Postprocessing: add a bloom pass to enhance glowing parts */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.2}
              luminanceSmoothing={0.1}
              intensity={1.5}
              kernelSize={KernelSize.SMALL}
            />
          </EffectComposer>
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default UniverseOfBloomingTreesScene;
