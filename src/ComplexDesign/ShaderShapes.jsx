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

    // Define the box position and size
    vec2 boxPosition = vec2(0.5, 0.3); // Bottom-left corner of the box (as a fraction of image size)
    vec2 boxSize = vec2(1.0, 0.4);     // Width and height of the box (as a fraction of image size)


    void main() {
        vec2 st = vUv;
        // In fragment shader it only focus on colorization and single depth values.
        // the vec2 st is or the vUv is the 2D texture of coordinates 
        
        // Adjust the gap size and number of boxes
        vec4 img = texture2D(u_texture, st);


        vec4 color = vec4(0.0);

        // Loop through and create the boxes
        // vec4 color = vec4(1.0,1.0,1.0,1.0) * img;

        // Each result will return 1.0 (white) or 0.0 (black).
        // float left = step(0.1,st.x);   // Similar to ( X greater than 0.1 )
        // float bottom = step(0.1,st.y); // Similar to ( Y greater than 0.1 )

        // float right = step(0.1, 1.0 - st.x); // Similar to ( X smaller than 1.0 )
        // float top = step(0.1, 1.0 - st.y); // Similar to ( Y smaller than 1.0 )

        // Step has a vector for x and y

        // Bottom Left 
        // How does it becomes a bottom left? becaues of the st - 0.1 because coordinates of st - n < m and 

        // describes like this bl => ( 1,0 ), (1,1), (0,1)
        //  (1, 0)        (0,0)
        //   _ _ _ _ _ _
        //  |           |
        //  |           |
        //  |           |
        //  | _ _ _ _ _ | (0,1)
        //  (1,1)
 
        // vec2 bl = step(vec2(0., 0.), st - 0.0);
        // vec2 tr = smoothstep(vec2(0.0, 1.0),vec2(1., 0.0), 1. - st);       
        // Top right because of that 1.0 - st which coordinates are all in n - st > m
        // Top Right
        // vec2 tr = step(vec2(0., 0.), 1.0 - st );

        // The multiplication of left*bottom will be similar to the logical AND.
        // vec3 sides = vec3(left * bottom * right * top );

        // vec3 sides = vec3(bl.x * tr.x * tr.y * bl.y);
        // color = vec4( sides, 1.0 );


        // Calculate the mask using bl and tr to make white transparent and black opaque
        // float mask =  tr.x  * tr.y * bl.x * bl.y;  // Intersection of the box sides

        // Make the color transparent if it's white (mask == 1), opaque if it's black (mask == 0)
        // color = vec4(img.rgb, mask);
        
        // Define the gap between the two images (set to 0.0 for no gap)
        float gap = 0.05;
  
        // Define the size of each image (each image takes half of the space minus the gap)
        float halfWidth = (1.0 - gap) * 0.5;
        float halfHeight = (1.0 - gap) * 0.5;
    
        // Initialize the color as transparent
  
        // If the fragment is on the top - left side, display the first image 1 / 4 of image
        if (st.x < halfWidth && st.y > (halfHeight + gap)) {
            // Scale the UV coordinates to map the first image properly
            vec2 newSt = vec2(st.x / halfWidth, (st.y - (halfHeight + gap)) / halfHeight );
            color = texture2D(u_texture, newSt);
        }

        // If the fragment is on the bottom - left side, display the first image 1 / 4 of image
        if (st.x < halfWidth && st.y < (halfHeight )) {
            // Scale the UV coordinates to map the first image properly
            vec2 newSt = vec2(st.x / halfWidth,  st.y / halfHeight );
            color = texture2D(u_texture, newSt);
        }
  
        // If the fragment is on the top - right side, display the second image
        else if (st.x > (halfWidth + gap) && st.y > halfHeight + gap) {
            // Scale and shift the UV coordinates for the second image
            vec2 newSt = vec2((st.x - (halfWidth + gap)) / halfWidth,  (st.y - (halfHeight + gap)) / halfHeight);
            color = texture2D(u_texture, newSt);
        }

        // If the fragment is on the bottom - right side, display the second image
        else if (st.x > (halfWidth + gap) && st.y < (halfHeight)) {
            // Scale and shift the UV coordinates for the second image
            vec2 newSt = vec2((st.x - (halfWidth + gap)) / halfWidth, (st.y / (halfHeight)) );
            color = texture2D(u_texture, newSt);
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

const ShaderShapes = () => {

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

export default ShaderShapes;
