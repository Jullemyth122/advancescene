import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import './text_glsl.scss';

const AnimatedText = ({  }) => {
    const materialRef = useRef(null);
    const textRef = useRef();


    useFrame(({ clock }) => {
      if (materialRef.current) {
          materialRef.current.uniforms.time.value = clock.getElapsedTime();
      }
    });

    return (
        <Text
        ref={textRef}
        position={[0, 0, 0]}
        fontSize={1}
        font="/assets/Roboto-Regular.ttf"
        >
        Shader Text
        <shaderMaterial
            ref={materialRef}
            attach="material"
            uniforms={{
              time: { value: 0 },
              color: { value: new THREE.Color(0.2, 0.5, 0.7) },
            }}
            vertexShader={`
              varying vec2 vUv;
              void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
                
                #define PI 3.14159265359
                uniform float time;
                uniform vec3 color;
                varying vec2 vUv;

                float random (in vec2 st) {
                    return fract(sin(dot(st.xy,
                                        vec2(12.9898,78.233)))*
                        43758.5453123);
                }

                float noise (in vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);

                    // Four corners in 2D of a tile
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));

                    vec2 u = f * f * (3.0 - 2.0 * f);

                    return mix(a, b, u.x) +
                            (c - a)* u.y * (1.0 - u.x) +
                            (d - b) * u.x * u.y;
                }

                void main() {
                    vec2 uv = vUv;

                    uv.x += sin(uv.y * 100.0 + time) * 0.5 - cos(uv.y * exp(time) );
                    uv.y += cos(uv.x * 0.5 + time) * 0.5;

                    float scale = 2.0;
                    float offset = 0.5;

                    float angle = noise( uv + time * 0.1 )*PI;
                    float radius = offset;

                    gl_FragColor = vec4(color.r , color.g, color.b  , 1.0);
                }
            `}
        />
        </Text>
    );
};

const TextGLSL = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Capture mouse movement
  const handleMouseMove = (event) => {
    setMouse({
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    });
  };

  return (
    <div 
        className='text_glsl' 
        // onMouseMove={handleMouseMove}
    >
      <Canvas className='three-canvas' shadows flat gl={{ antialias: true }} camera={{ position: [0, 1, 5] }}>
        <ambientLight />
        <AnimatedText 
            // mouse={mouse} 
        />
      </Canvas>
    </div>
  );
};

export default TextGLSL;
