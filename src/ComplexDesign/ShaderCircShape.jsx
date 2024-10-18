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



    void main() {
        vec2 st = vUv;
        // In fragment shader it only focus on colorization and single depth values.
        // the vec2 st is or the vUv is the 2D texture of coordinates 
        
        // Adjust the gap size and number of boxes
        vec4 img = texture2D(u_texture, st);


        // Initialize the color as transparent
        vec4 color = vec4(0.0);    


        // // Define the center points of the "circles"
        // vec2 center1 = vec2(0.1, 0.1);
        // vec2 center2 = vec2( cos(u_time / 2.) * 1.5, 0.1);
        // vec2 center3 = vec2(0.9, 0.1);
        // vec2 center4 = vec2(0.9, 0.9);
        // vec2 center5 = vec2( sin(u_time / 2.) * 1.5, 0.9);
        // vec2 center6 = vec2(0.1, 0.9);

        // // Calculate the distance to the center points and scale them down
        // float circlepoint1 = distance(st, center1);
        // float circlepoint2 = distance(st, center2);
        // float circlepoint3 = distance(st, center3);
        // float circlepoint4 = distance(st, center4);
        // float circlepoint5 = distance(st, center5);
        // float circlepoint6 = distance(st, center6);

        // // Combine the circle points (you can experiment with different methods here)
        // float circlepoint = circlepoint1 * circlepoint2 * circlepoint3 * circlepoint4 * circlepoint5 * circlepoint6;

        // circlepoint = smoothstep(0.00, 0.1, circlepoint);  // Adjust these values for finer control
        // circlepoint = smoothstep(0.00, 0.1, circlepoint);  // Adjust these values for finer control
        // circlepoint = smoothstep(0.00, 0.1, circlepoint);  // Adjust these values for finer control

        // color = vec4( vec3(circlepoint) * img.rgb, 1.0);

        float pct = 0.0;
        vec2 tC = vec2(0.5)-st;

        // Square Root Pattern
        // pct = sqrt(tC.x * sin(u_time*tC.y)+tC.y*tC.y * cos(u_time*tC.x));
        // pct = inversesqrt(tC.x * sin(u_time*tC.y*tC.x)+tC.y * tC.y * cos(u_time*tC.x));

        // pct = inversesqrt(tC.x * tC.x * sin(u_time*tC.y*tC.x)+tC.y * tC.y * cos(u_time*tC.x * tC.y));
        // pct = inversesqrt(tC.x * sin(u_time*tC.y*tC.y)+tC.y * tC.y * cos(u_time*tC.x));
        // pct = inversesqrt(tC.x * tanh(u_time*tC.y)+tC.y * tC.y * cos(u_time*tC.x));
        // pct = inversesqrt(tC.x * sin(u_time*tC.y*tC.x)+tC.y * tC.y * cos(u_time*tC.x));

        vec3 pointColor = vec3(pct);
        color = vec4( pointColor * img.rgb, 1.0);

        gl_FragColor = color;

        // gl_FragColor = vec4(color, 1.0);

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

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

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

const ShaderCircShape = () => {

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

export default ShaderCircShape;
