// ShaderToy1.jsx
import React, { useRef, useMemo, forwardRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

// postprocessing Effect
import { Effect } from 'postprocessing'
import { EffectComposer, GodRays, Bloom, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing' // for GodRays blendFunction

import './shaders.scss'

RectAreaLightUniformsLib.init()

const GodRaySource = forwardRef((props, ref) => {
  return (
    <mesh ref={ref} position={[3, 1.15, 10]} rotation={[0, 0, 0]}>
      <planeGeometry args={[3, 4]} />
      <meshStandardMaterial
        color={'#b0dfff'}
        emissive={'#b0dfff'}
        emissiveIntensity={15.0}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
})

function Scene({ sphereRef, rectLightRef, godRaySourceRef }) {
  const sh = useMemo(() => {
    const harmonics = new THREE.SphericalHarmonics3()
    harmonics.fromArray([
      0.35, 0.35, 0.45, 0.15, 0.15, 0.25, -0.1, -0.1, -0.15, 0.05, 0.05, 0.1,
      0.08, 0.08, 0.12, 0.03, 0.03, 0.05, -0.06, -0.06, -0.09, 0.02, 0.02, 0.03,
      0.04, 0.04, 0.06
    ])
    return harmonics
  }, [])

  const [colorMap, roughnessMap, aoMap] = useTexture([
    '/img/x1.jpg',
    '/img/x3.jpg',
    '/img/x4.jpg',
  ])

  // Simple animation for the sphere
  useFrame((state, delta) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += delta * 0.3
      sphereRef.current.rotation.x += delta * 0.2
    }
  })

  return (
    <>
      <color attach="background" args={['#1a1a2a']} />
      <primitive object={new THREE.LightProbe(sh)} intensity={3.5} />

      <rectAreaLight
        ref={rectLightRef}
        width={3}
        height={4}
        intensity={12}
        color={'#b0dfff'}
        position={[3, 1.15, 10]}
      />

      <GodRaySource ref={godRaySourceRef} />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          map={colorMap}
          metalness={0.9}
          roughness={0.9}
          roughnessMap={roughnessMap}
          aoMap={aoMap}
          aoMapIntensity={1}
          side={THREE.DoubleSide}
          envMapIntensity={0.5}
        />
      </mesh>

      <mesh ref={sphereRef} position={[2, 0, -2]}>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshStandardMaterial
          color={'#9ad3ff'}
          metalness={0.2}
          roughness={0.1}
        />
      </mesh>
    </>
  )
}

/**
 * FogEffect - a custom postprocessing Effect that:
 * - receives screen-space positions for the sphere and the light (uSpherePos, uLightPos)
 * - uses smoothstep to produce a soft mask around those points
 * - uses time to move the noise/fog for a smoky look
 *
 * Implementation details:
 * - We compute screen-space positions in JS (project world to NDC then to [0,1] UV)
 * - We update uniforms each frame (uTime, uSpherePos, uLightPos, uSphereRadius)
 * - The fragment mixes the scene color with a fog color using the mask
 */
// Replace your FogEffect with this version
// Replace your FogEffect with this function
function FogEffect({ sphereRef, rectLightRef, camera }) {
  const { size, gl, scene } = useThree()

  const fragment = `
    precision mediump float;

    uniform vec2 uSpherePos;
    uniform vec2 uLightPos;
    uniform float uSphereRadius;
    uniform float uLightRadius;
    uniform float uTime;

    uniform float uScale;
    uniform float uSpeed;
    uniform float uDensity;
    uniform float uAdditive;
    uniform float uOpacity;

    // depth occlusion
    uniform sampler2D tDepth;
    uniform float uDepthBias;       // in linear view-space units (meters)
    uniform float uShadowStrength;  // 0..1
    uniform float uNear;
    uniform float uFar;

    // endpoint depths in non-linear depth (0..1)
    uniform float uSphereDepth;
    uniform float uLightDepth;

    // simple hash + noise
    float hash21(vec2 p){
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float snoise(vec2 p){
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i + vec2(0.0,0.0));
      float b = hash21(i + vec2(1.0,0.0));
      float c = hash21(i + vec2(0.0,1.0));
      float d = hash21(i + vec2(1.0,1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0;
      float amp = 0.6;
      for (int i = 0; i < 5; i++) {
        v += amp * snoise(p);
        p = p * 2.0 + vec2(1.7, -1.3);
        amp *= 0.5;
      }
      return v;
    }

    // convert depth buffer value (0..1) to view-space linear depth (positive)
    float linearizeDepth(float depth) {
      float z_ndc = depth * 2.0 - 1.0;
      // linear view Z (positive depth in same units as camera near/far)
      return (2.0 * uNear * uFar) / (uFar + uNear - z_ndc * (uFar - uNear));
    }

    // seg info: t (0..1 along segment) and distance to segment
    vec2 segInfo(vec2 p, vec2 a, vec2 b){
      vec2 ab = b - a;
      float abLen2 = dot(ab,ab) + 1e-6;
      float t = clamp(dot(p - a, ab) / abLen2, 0.0, 1.0);
      vec2 proj = a + ab * t;
      float d = length(p - proj);
      return vec2(t, d);
    }

    vec4 processScene(vec4 scene, vec2 uv) {
      vec2 si = segInfo(uv, uSpherePos, uLightPos);
      float segT = si.x;
      float segD = si.y;

      float lengthFall = smoothstep(0.0, 0.25, segT) * smoothstep(1.0, 0.75, segT);
      float centerBias = 1.0 - abs(segT - 0.5) * 2.0;
      float thickness = mix(0.38, 0.06, abs(segT - 0.5));
      float tubeMask = smoothstep(thickness, thickness * 0.45, segD) * lengthFall;

      float ds = length(uv - uSpherePos);
      float dl = length(uv - uLightPos);
      float sphereHalo = smoothstep(uSphereRadius, uSphereRadius * 0.2, ds);
      float lightHalo = smoothstep(uLightRadius, uLightRadius * 0.2, dl);

      vec2 segDir = normalize(uLightPos - uSpherePos);
      vec2 flow = segDir * uSpeed * uTime;
      vec2 noiseUv = (uv - (uSpherePos + segDir * segT)) * uScale;
      float along = dot(uv - uSpherePos, segDir);
      noiseUv += vec2(along * 2.2 * segDir.x, along * 2.2 * segDir.y);
      noiseUv += flow;

      float n = fbm(noiseUv * 1.0) * 0.9;
      n += 0.6 * fbm(noiseUv * 2.0);
      n += 0.33 * fbm(noiseUv * 4.0);

      float densityCurve = pow(centerBias * 0.9 + 0.1, 1.6);
      float localFog = clamp(n * densityCurve * uDensity, 0.0, 1.0);
      float fogMask = clamp(max(tubeMask, max(sphereHalo * 0.9, lightHalo * 0.9)) * localFog, 0.0, 1.0);

      // sample scene depth (non-linear 0..1)
      float sceneDepthRaw = texture(tDepth, uv).x;

      // fog endpoint raw depths are provided as non-linear 0..1 (uSphereDepth/uLightDepth)
      // linearize everything to view-space Z before comparing
      float sceneZ = linearizeDepth(sceneDepthRaw);
      float sphereZ = linearizeDepth(uSphereDepth);
      float lightZ  = linearizeDepth(uLightDepth);
      float fogZ = mix(sphereZ, lightZ, segT);

      // occlusion: sceneZ smaller => scene is closer (blocks fog)
      // occSoft = 1.0 when scene is closer than fogZ (fully blocking)
      float occSoft = 1.0 - smoothstep(fogZ - uDepthBias, fogZ + uDepthBias, sceneZ);
      occSoft = clamp(occSoft, 0.0, 1.0);

      float visibleFog = fogMask * (1.0 - occSoft);
      float shadow = occSoft * fogMask * clamp(uShadowStrength, 0.0, 1.0);

      vec3 fogColor = vec3(0.58, 0.68, 0.78);
      vec3 scattered = scene.rgb + fogColor * 1.1 * visibleFog * uAdditive;
      vec3 sceneSoft = mix(scene.rgb, scattered, visibleFog * 0.7);
      sceneSoft *= (1.0 - shadow);
      sceneSoft *= (1.0 - 0.12 * visibleFog);

      return vec4(mix(scene.rgb, sceneSoft, visibleFog), scene.a);
    }

    vec4 mainImage(vec2 uv) {
      vec4 scene = texture(inputBuffer, uv);
      return processScene(scene, uv);
    }
    vec4 mainImage(vec4 color, vec2 uv) {
      return processScene(color, uv);
    }
    vec4 mainImage(vec4 color0, vec2 uv, vec4 color1) {
      return processScene(color0, uv);
    }
  `

  // create depth render target + depth texture
  const { depthTarget, depthTexture } = React.useMemo(() => {
    const depthTex = new THREE.DepthTexture()
    depthTex.type = THREE.UnsignedShortType
    depthTex.minFilter = THREE.NearestFilter
    depthTex.magFilter = THREE.NearestFilter

    const rt = new THREE.WebGLRenderTarget(Math.max(1, size.width), Math.max(1, size.height), {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      depthTexture: depthTex,
      depthBuffer: true
    })
    return { depthTarget: rt, depthTexture: depthTex }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const effect = useMemo(() => {
    const uniforms = new Map()
    uniforms.set('uSpherePos', new THREE.Uniform(new THREE.Vector2(0.5, 0.5)))
    uniforms.set('uLightPos', new THREE.Uniform(new THREE.Vector2(0.5, 0.5)))
    uniforms.set('uSphereRadius', new THREE.Uniform(0.15))
    uniforms.set('uLightRadius', new THREE.Uniform(0.28))
    uniforms.set('uTime', new THREE.Uniform(0.0))
    uniforms.set('uScale', new THREE.Uniform(3.0))
    uniforms.set('uSpeed', new THREE.Uniform(0.25))
    uniforms.set('uDensity', new THREE.Uniform(1.6))
    uniforms.set('uAdditive', new THREE.Uniform(0.9))
    uniforms.set('uOpacity', new THREE.Uniform(0.9))

    uniforms.set('tDepth', new THREE.Uniform(depthTexture))
    uniforms.set('uDepthBias', new THREE.Uniform(0.06)) // in view-space units (tweak)
    uniforms.set('uShadowStrength', new THREE.Uniform(0.35)) // 0..1
    uniforms.set('uNear', new THREE.Uniform(0.1))
    uniforms.set('uFar', new THREE.Uniform(1000.0))

    uniforms.set('uSphereDepth', new THREE.Uniform(1.0))
    uniforms.set('uLightDepth', new THREE.Uniform(1.0))

    const ef = new Effect('ScreenFogEffectWithDepth', fragment, { uniforms })
    ef.blendMode.opacity.value = 1.0
    return ef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragment, depthTexture])

  // helper: project to NDC and return uv + raw non-linear depth (0..1)
  const worldToScreenUV = (pos, cam) => {
    const p = pos.clone().project(cam) // NDC -1..1
    const uv = new THREE.Vector2((p.x + 1) / 2, (1 - p.y) / 2)
    const depth01 = p.z * 0.5 + 0.5
    return { uv, depth01 }
  }

  React.useEffect(() => {
    depthTarget.setSize(Math.max(1, size.width), Math.max(1, size.height))
  }, [size.width, size.height, depthTarget])

  useFrame((state, delta) => {
    if (!effect) return
    const cam = camera || state.camera

    // render scene into depth target
    const oldRt = gl.getRenderTarget()
    gl.setRenderTarget(depthTarget)
    gl.render(scene, cam)
    gl.setRenderTarget(oldRt)

    // update camera near/far to shader (important for linearization)
    effect.uniforms.get('uNear').value = cam.near
    effect.uniforms.get('uFar').value = cam.far

    if (sphereRef?.current) {
      const wp = new THREE.Vector3()
      sphereRef.current.getWorldPosition(wp)
      const { uv, depth01 } = worldToScreenUV(wp, cam)
      effect.uniforms.get('uSpherePos').value.copy(uv)
      const worldRadius = 0.8
      const offset = wp.clone().add(new THREE.Vector3(worldRadius, 0, 0))
      const uvOffset = worldToScreenUV(offset, cam).uv
      const r = Math.max(0.01, uv.distanceTo(uvOffset))
      effect.uniforms.get('uSphereRadius').value = r * 1.4
      effect.uniforms.get('uSphereDepth').value = depth01
    }

    if (rectLightRef?.current) {
      const wp = new THREE.Vector3()
      rectLightRef.current.getWorldPosition(wp)
      const { uv, depth01 } = worldToScreenUV(wp, cam)
      effect.uniforms.get('uLightPos').value.copy(uv)
      const worldRadius = 1.5
      const offset = wp.clone().add(new THREE.Vector3(worldRadius, 0, 0))
      const uvOffset = worldToScreenUV(offset, cam).uv
      const r = Math.max(0.01, uv.distanceTo(uvOffset))
      effect.uniforms.get('uLightRadius').value = r * 1.8
      effect.uniforms.get('uLightDepth').value = depth01
    }

    effect.uniforms.get('uTime').value += delta

    if (sphereRef?.current && rectLightRef?.current) {
      const s = new THREE.Vector3()
      const l = new THREE.Vector3()
      sphereRef.current.getWorldPosition(s)
      rectLightRef.current.getWorldPosition(l)
      const sUV = worldToScreenUV(s, cam).uv
      const lUV = worldToScreenUV(l, cam).uv
      const dir = lUV.clone().sub(sUV).normalize()
      // no explicit uFlow in this shader, flow computed from uSpherePos/uLightPos inside fragment
    }
  })

  return <primitive object={effect} dispose={null} />
}



export default function ShaderToy1() {
  // refs lifted to top-level so composer can see them
  const godRaySourceRef = useRef()
  const rectLightRef = useRef()
  const sphereRef = useRef()

  return (
    <div className="shaders-canvas">
      <Canvas
        camera={{ position: [-5, 3, 8], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Scene
          sphereRef={sphereRef}
          rectLightRef={rectLightRef}
          godRaySourceRef={godRaySourceRef}
        />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={2}
          maxDistance={30}
        />

        <EffectComposer>
          {godRaySourceRef.current && (
            <GodRays
              sun={godRaySourceRef.current}
              blendFunction={BlendFunction.SCREEN}
              samples={60}
              density={0.97}
              decay={0.97}
              weight={0.6}
              exposure={0.4}
            />
          )}

          <Bloom
            luminanceThreshold={1.0}
            mipmapBlur={true}
            luminanceSmoothing={0.5}
            intensity={0.65}
          />

          {/* Our custom fog effect — uses the screen-space positions of the sphere/light */}
          <FogEffect
            sphereRef={sphereRef}
            rectLightRef={rectLightRef}
          />

          <Noise
            premultiply
            blendFunction={BlendFunction.SOFT_LIGHT}
            opacity={0.08}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
