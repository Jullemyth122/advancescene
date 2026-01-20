import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "../ComplexDesign/imgshdr.scss";
import { OrbitControls, ScrollControls, useScroll, Scroll } from "@react-three/drei";
import gsap from "gsap";
import { useEffect } from "react";

const fragmentShader = `
    uniform sampler2D u_texture; 
    varying vec2 vUv;
    uniform vec2 u_resolution; 
    uniform float u_time;

    float map(in vec3 pos) {
        float d = length(pos) - 0.25;

        return d;
    }

    vec3 calcNormal( in vec3 pos ) {
        vec2 e = vec2(0.0001, 0.0);
        return normalize( vec3( map(pos + e.xyy) - map(pos-e.xyy), 
                                map(pos + e.yxy) - map(pos-e.yxy), 
                                map(pos + e.yyx) - map(pos-e.yyx)
                                ));
        
    }

    void main() {
        // Compute pixel coordinates based on resolution.
        // vec2 pixelCoords = vUv * u_resolution;

        vec2 p = (2.0 * vUv - 1.0);  // Maps vUv from [0,1] to [-1,1]
        p.x *= u_resolution.x / u_resolution.y; 

        // vec2 r = u_resolution;
        // float t = u_time;

        vec3 ro = vec3(0.0, 0.0, 1.0);
        vec3 rd = normalize(vec3(p,-1.5));

        vec3 col = vec3(0.0);

        float t = 0.0;

        for(int i=0; i<100; i++) {
            vec3 pos = ro + t*rd;

            float h = map(pos);

            if ( h < 0.001 ) 
                break;
            t += h;

            if (t>20.0) break;


        }

        if(t<20.0) {
            vec3 pos = ro + t * rd;
            vec3 nor = calcNormal(pos);

            // col = vec3(1.0);
            col = nor.yyy;
        }

        gl_FragColor = vec4(col, 1.0);
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

const RaymarchingObject = () => {

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

export default RaymarchingObject;
