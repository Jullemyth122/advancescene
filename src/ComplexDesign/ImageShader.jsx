import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import "./imgshdr.scss";
import { OrbitControls } from "@react-three/drei";

const fragmentShader = `

    uniform sampler2D u_texture; 
    varying vec2 vUv;
    uniform vec2 u_resolution; 
    uniform float u_time; 

    void main() {
        vec2 st = vUv;
    
        // Adjust the gap size and number of boxes
        vec4 img = texture2D(u_texture, st);

        float gapSizeY = 0.5;
        float gapSizeX = 0.0; // No gap in the x vector
        int numBoxes = 10;

        // Calculate the size of each box based on the gap size and number of boxes
        float boxSizeY = 1.0 / float(numBoxes);
        float boxSizeX = 1.0 / float(numBoxes);

        // Loop through and create the boxes
        vec4 color = vec4(0.0);
        for (int i = 0; i < numBoxes; ++i) {
            // Animate scaleX and scaleY with a staggered effect from right to left
            float columnDelay = 0.1;
            float maxColumn = float(numBoxes) - 1.0;
            float timeBasedOffset = u_time - (maxColumn - float(i)) * columnDelay;

            // Animate scaleX
            float scaleX;
            if (timeBasedOffset < 8.0) {
                scaleX = boxSizeX * (clamp(smoothstep(0.0, 1.0, sin(timeBasedOffset)), 0.0, 1.0));
            } else {
                scaleX = boxSizeX;
            }

            float scaleY = boxSizeY * (clamp(smoothstep(0.0, 1.0, timeBasedOffset), 0.0, 1.0));
            
            for (int j = 0; j < numBoxes; ++j) {
                float x = gapSizeX * float(i+1) + boxSizeX * float(i);
    
                // Animate gapSizeY based on animation progress
                float gapSizeYAnim = gapSizeY * (1.0 - clamp(smoothstep(0.0, 1.0, timeBasedOffset), 0.0, 1.0));
                float y = gapSizeYAnim * float(j+1) + scaleY * float(j);
    
                if (scaleX >= boxSizeX) {
                    scaleX = boxSizeX;
                }
    
                if (st.x > x && st.x < x + scaleX && st.y > y && st.y < y + scaleY) {
                    color = img * vec4(1.0, 1.0, 1.0, 1.0); // Box color from the texture
                }
            }
        }
        gl_FragColor = color;

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

        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        // modelPosition.y += sin(modelPosition.x * 4.0 + u_time * 2.0) * 0.2;
        modelPosition.x += sin(modelPosition.y * 4.0 + u_time * 2.0) * 0.2;
        // modelPosition.z += cos((modelPosition.y * 4.0 + modelPosition.x * 4.0) + u_time * 2.0) * 0.2;

        // Uncomment the code and hit the refresh button below for a more complex effect 🪄
        // modelPosition.y += sin(modelPosition.z * 6.0 + u_time * 2.0) * 0.1;

        vec4 viewPosition = viewMatrix * modelPosition;

        // viewPosition.x += sin(u_time * 2.0 - modelPosition.x);
        vec4 projectedPosition = projectionMatrix * viewPosition;
        
        // MVP
        gl_Position = projectedPosition;

        // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    }
`;

export const Scene = () => {
  const shadersRef = useRef(null);

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
        <planeGeometry args={[1, 1, 16, 16]} />
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

      {/* <mesh position={[0,0,-5]}>
        <boxGeometry args={[2,2]}></boxGeometry>
        <meshBasicMaterial color={0x3f3f3f}></meshBasicMaterial>
      </mesh> */}
    </>
  );
};

const ImageShader = () => {
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

export default ImageShader;
