import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./imgshdr.scss";
import { OrbitControls, ScrollControls, useScroll, Scroll } from "@react-three/drei";
import gsap from "gsap";
import { useEffect } from "react";

const fragmentShader = `

    uniform sampler2D u_texture; 
    varying vec2 vUv;
    uniform vec2 u_resolution; 
    uniform float u_time;

    #define PHI 1.618034;
    #define TAU 6.283185;

    float circle(in vec2 _st, in float _radius) {
      vec2 dist = _st-vec2(0.5);
      return 1. - smoothstep(_radius - (_radius* 0.01), _radius+(_radius* 0.01), dot(dist,dist) * 4.0);
    }

    void main() {
        vec2 st = vUv;
        // In fragment shader it only focus on colorization and single depth values.
        // the vec2 st is or the vUv is the 2D texture of coordinates 
        
        // Adjust the gap size and number of boxes
        vec4 img = texture2D(u_texture, st);

        // Initialize the color as transparent
        


        vec4 color = vec4(0.0);    

      	color = vec4(vec3(circle(st,0.9)));

        // color = vec4( color * img.rgb, 1.0);
        
        gl_FragColor = color;

        // gl_FragColor = vec4(color * img.rgb, 1.0);

    }

`;

const vertexShader = `

    uniform float u_time;
    varying vec2 vUv;
    
    void main() {

        vUv = uv;
        // Transform -> position, scale, position
        // modelMatrix -> position, scale, rotation of model
        // viewMatrix -> position, orientation of camera
        // projectionMatrix -> projection our object onto the screen (aspect ratio & the perspective)

        // model moves to the z (0,0,1), (0,0,2) --> 25th-position (  0,0,25 ) 
        vec4 modelPosition = modelMatrix * vec4(position,1.0);
        
        // modelPosition.z += sin(modelPosition.x * 1.0 + (u_time * 5.0)) * 0.5;
        // modelPosition.z += sin(modelPosition.y * u_time  + u_time * modelPosition.z) * 0.5;
        
        // modelPosition.z += sin(modelPosition.x * sqrt(u_time)  + sqrt(u_time) * modelPosition.y) * 0.5;
        // modelPosition.x +=  sqrt(modelPosition.z * modelPosition.z * sin(u_time * modelPosition.z * modelPosition.z) + modelPosition.y * modelPosition.y) ;
        // modelPosition.y += sin(modelPosition.z * u_time  + u_time * modelPosition.x) * 0.5;
        
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;

    }
`;

export const Scene = () => {
  const shadersRef = useRef(null);

  const [curve] = useState(() => {
    // Create an empty array to stores the points
    let points = []
    // Define points along Z axis
    for (let i = 0; i < 50; i += 1)
      points.push(new THREE.Vector3(1 - Math.random() * 2, 1 - Math.random() * 2, 10 * (i / 4)))
    return new THREE.CatmullRomCurve3(points)
  })
  const texture = useLoader(THREE.TextureLoader, "./img/AXC.jpg");

  const data = useMemo(
    () => ({
      u_texture: { type: "t", value: texture },
      u_time: { type: "f", value: 0.0 },
      u_resolution: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
      transform: { value: new THREE.Vector3(0, 0, 0) },
    }),
    [texture]
  );

  useFrame(({ clock }) => {
    if (shadersRef.current) {
      shadersRef.current.uniforms.u_time.value = clock.getElapsedTime();
    }
  });

  return (
    <>
      <ambientLight />
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1,1,1,64]} />
        {/* <tubeGeometry args={[curve, 70, 5 ,50,false]}/> */}
        <shaderMaterial
          transparent={true}
          ref={shadersRef}
          uniforms={data}
          // wireframe={true}
          fragmentShader={fragmentShader}
          vertexShader={vertexShader}
          side={THREE.DoubleSide}
        ></shaderMaterial>
      </mesh>
    </>
  );
};

const ShaderMotion = () => {

  const cfx = gsap.context(() => {})
  
  useLayoutEffect(() => {

  },[])

  useEffect(() => {

  },[])

  return (
    <div className="img-shader-comp">
      <Canvas
        className="three-canvas"
        flat
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 2] }}
      >
        <Scene />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default ShaderMotion;
