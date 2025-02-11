import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./imgshdr.scss";
import { OrbitControls, ScrollControls, useScroll, Scroll } from "@react-three/drei";
import gsap from "gsap";
import { useEffect } from "react";

const fragmentShader = `
  uniform sampler2D u_texture_tl; // Top-left texture
  uniform sampler2D u_texture_tr; // Top-right texture
  uniform sampler2D u_texture_bl; // Bottom-left texture
  uniform sampler2D u_texture_br; // Bottom-right texture

  varying vec2 vUv;
  uniform vec2 u_resolution; 
  uniform float u_time;

  #define PHI 1.618034;
  #define TAU 6.283185;

  // Define the box position and size
  vec2 boxPosition = vec2(0.5, 0.3); // Bottom-left corner of the box (as a fraction of image size)
  vec2 boxSize = vec2(1.0, 0.4);     // Width and height of the box (as a fraction of image size)

  void main() {
      vec2 st = vUv;
      // In fragment shader it only focuses on colorization and single depth values.
      // the vec2 st is or the vUv is the 2D texture of coordinates
      
      // Adjust the gap size and number of boxes
      vec4 img = texture2D(u_texture_tl, st); // Default texture

      vec4 color = vec4(0.0);

      // Loop through and create the boxes
      // vec4 color = vec4(1.0, 1.0, 1.0, 1.0) * img;

      // Each result will return 1.0 (white) or 0.0 (black).
      // float left = step(0.1, st.x);   // Similar to (X greater than 0.1)
      // float bottom = step(0.1, st.y); // Similar to (Y greater than 0.1)

      // float right = step(0.1, 1.0 - st.x); // Similar to (X smaller than 1.0)
      // float top = step(0.1, 1.0 - st.y); // Similar to (Y smaller than 1.0)

      // Step has a vector for x and y

      // Bottom Left 
      // How does it become a bottom-left? Because of the st - 0.1, because coordinates of st - n < m

      // describes like this bl => (1, 0), (1, 1), (0, 1)
      // (1, 0)        (0, 0)
      // _ _ _ _ _ _
      // |           |
      // |           |
      // |           |
      // | _ _ _ _ _ | (0,1)
      // (1, 1)

      // vec2 bl = step(vec2(0., 0.), st - 0.0);
      // vec2 tr = smoothstep(vec2(0.0, 1.0), vec2(1., 0.0), 1. - st);       
      // Top right because of that 1.0 - st, which coordinates are all in n - st > m
      // Top Right
      // vec2 tr = step(vec2(0., 0.), 1.0 - st);

      // The multiplication of left * bottom will be similar to the logical AND.
      // vec3 sides = vec3(left * bottom * right * top );

      // vec3 sides = vec3(bl.x * tr.x * tr.y * bl.y);
      // color = vec4(sides, 1.0);

      // Calculate the mask using bl and tr to make white transparent and black opaque
      // float mask = tr.x * tr.y * bl.x * bl.y;  // Intersection of the box sides

      // Make the color transparent if it's white (mask == 1), opaque if it's black (mask == 0)
      // color = vec4(img.rgb, mask);

      // Define the gap between the two images (set to 0.0 for no gap)
      float gap = 0.01;

      // Define the size of each image (each image takes half of the space minus the gap)
      float halfWidth = (1.0 - gap) * 0.5;
      float halfHeight = (1.0 - gap) * 0.5;

      // Initialize the color as transparent

      // If the fragment is on the top-left side, display the first image (top-left quadrant)
      if (st.x < halfWidth && st.y > (halfHeight + gap)) {
          // Scale the UV coordinates to map the first image properly
          vec2 newSt = vec2(st.x / halfWidth, (st.y - (halfHeight + gap)) / halfHeight );
          color = texture2D(u_texture_tl, newSt); // Use the top-left texture
      }

      // If the fragment is on the bottom-left side, display the second image (bottom-left quadrant)
      else if (st.x < halfWidth && st.y < halfHeight) {
          // Scale the UV coordinates to map the second image properly
          vec2 newSt = vec2(st.x / halfWidth, st.y / halfHeight );
          color = texture2D(u_texture_bl, newSt); // Use the bottom-left texture
      }

      // If the fragment is on the top-right side, display the third image (top-right quadrant)
      else if (st.x > (halfWidth + gap) && st.y > (halfHeight + gap)) {
          // Scale and shift the UV coordinates for the third image
          vec2 newSt = vec2((st.x - (halfWidth + gap)) / halfWidth, (st.y - (halfHeight + gap)) / halfHeight);
          color = texture2D(u_texture_tr, newSt); // Use the top-right texture
      }

      // If the fragment is on the bottom-right side, display the fourth image (bottom-right quadrant)
      else if (st.x > (halfWidth + gap) && st.y < halfHeight) {
          // Scale and shift the UV coordinates for the fourth image
          vec2 newSt = vec2((st.x - (halfWidth + gap)) / halfWidth, st.y / halfHeight);
          color = texture2D(u_texture_br, newSt); // Use the bottom-right texture
      }

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

        // model moves to the z (0,0,1), (0,0,2) --> 25th-position (  0,0,25 ) 
        vec4 modelPosition = modelMatrix * vec4(position,1.0);
        
        // modelPosition.z += cos((modelPosition.y * 4.0 + modelPosition.x * 4.0) + u_time * 2.0) * 0.2;
        modelPosition.z += cos(( (modelPosition.y) * 4.0 + ( modelPosition.x / 2.0 + modelPosition.y ) * 4.0) + u_time * 1.0) * 0.2;

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

  const textureTL = useLoader(THREE.TextureLoader, "./img/me1.jpg");  // Top-left image
  const textureTR = useLoader(THREE.TextureLoader, "./img/me2.jpg");  // Top-right image
  const textureBL = useLoader(THREE.TextureLoader, "./img/me3.jpg");  // Bottom-left image
  const textureBR = useLoader(THREE.TextureLoader, "./img/me4.jpg");  // Bottom-right image
  
  const data = useMemo(() => ({
    u_texture_tl: { type: "t", value: textureTL },
    u_texture_tr: { type: "t", value: textureTR },
    u_texture_bl: { type: "t", value: textureBL },
    u_texture_br: { type: "t", value: textureBR },
    u_time: { type: "f", value: 0.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
  }), [textureTL, textureTR, textureBL, textureBR]);


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
        shadows
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
