import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
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

    float fibonacci(float n) {
        float a = 0.0;
        float b = 1.0;
        float c;
        
        for (float i = 0.0; i < n; i++) {
            c = a + b;
            a = b;
            b = c;
        }
        
        return a;
    }

    void main() {
        // Compute pixel coordinates based on resolution.
        vec2 pixelCoords = vUv * u_resolution;
        vec2 r = u_resolution;
        float t = u_time;

        // (Optional) Apply some offset if needed.
        pixelCoords.x += sin(pixelCoords.y * 0.0 + u_time) * 1.0;
        
        // Convert back to normalized coordinates before sampling:
        vec2 normCoords = pixelCoords / u_resolution;
        
        // Here we use a gridCount of 1 so the whole image is used.
        vec2 gridCount = vec2(1.0, 1.0);
        vec2 cellUv = fract(normCoords * gridCount);

        // Sample the texture using normalized coordinates.
        vec4 texColor = texture2D(u_texture, cellUv);

        // --- Detect White ---
        // Define a threshold for what counts as "white"
        float threshold = 0.9;
        // Check if all color components are above the threshold.
        // Using min() ensures that if any channel is lower, the value is lower.

        float whiteDetection = step(threshold, min(min(texColor.r, texColor.g), texColor.b));

        // Option 1: Make white pixels transparent.
        vec4 resultColor = texColor;
        // resultColor.a *= 1.0 - whiteDetection;
        
        // Option 2 (alternative): Change white pixels to a different color (e.g., red)
        // Uncomment the next line if you prefer this:

        vec2 imgsUv = fract(normCoords * vec2(10.0,10.0));
        vec4 tex2Color = texture2D(u_texture,imgsUv);

        resultColor = mix(texColor, sin(tex2Color), whiteDetection);
        

        gl_FragColor = resultColor;
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
        // modelPosition.x += sin(modelPosition.y * 4.0 + u_time * 2.0) * 0.2;
        modelPosition.z += cos((modelPosition.y * 4.0 + modelPosition.x * 4.0) + u_time * 2.0) * 0.2;

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
    const { size } = useThree(); // Access canvas size

    const [curve] = useState(() => {
        let points = []
        // Define points along Z axis
        for (let i = 0; i < 50; i += 1)
            points.push(new THREE.Vector3(1 - Math.random() * 2, 1 - Math.random() * 2, 10 * (i / 4)))
        return new THREE.CatmullRomCurve3(points)
    })
    const texture = useLoader(THREE.TextureLoader, "./img/twt.jpg");

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

    
    useLayoutEffect(() => {
        if (shadersRef.current) {
            shadersRef.current.uniforms.u_resolution.value.set(size.width, size.height);
        }
    }, [size]);

    return (
        <>
        <ScrollControls>
            <ambientLight />
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                <planeGeometry args={[1,1,128,128]} />
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
        </ScrollControls>
        </>
    );
};

const ImageShaderPopup3 = () => {

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

export default ImageShaderPopup3;
