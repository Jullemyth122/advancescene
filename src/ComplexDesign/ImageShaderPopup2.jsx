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

    
    float fibonacci(float n) {
        float a = 0.0;
        float b = 1.0;
        float c;
        
        for (float i = 0.0; i < n; i++) {
            c = a + b;
            a = b;
            b = c;
        }
        
        return a; // Returning the n-th Fibonacci number
    }

    // Define the box position and size
    vec2 boxPosition = vec2(0.5, 0.3); // Bottom-left corner of the box (as a fraction of image size)
    vec2 boxSize = vec2(1.0, 0.4);     // Width and height of the box (as a fraction of image size)


    void main() {
        vec2 st = vUv;
        // st *= st;

        float cycleTime = 7.0;
        float t = fract(u_time / cycleTime);

        // Set the number of repetitions (columns and rows)
        // vec2 gridCount = vec2(5.0,5.0);
        vec2 gridCount = vec2(5.0, 5.0);

        // Multiply the UVs by the grid count and take the fractional part to tile them
        vec2 cellUV = fract(st * gridCount);
        // vec2 cellUV = vec2(st.x * gridCount.x  - floor(st.x * gridCount.x),st.y - floor(st.y));

        // Gap size as a fraction of each cell
        float gap = 0.1;

        // gap = (sin(u_time + 1.p) < 0.0)
        //     ? (10. * sin(u_time + 1.p) * sin(u_time + 1.p))
        //     : (1.0 - pow(-10. * sin(u_time + 1.p) + 10., 10.) / 10.);
        // gap = smoothstep(0., t, 1.0 );

        // Check if the current cellUV is inside the active (non-gap) region:
        float insideX = step(gap, cellUV.x) * step(cellUV.x, 1.0 - gap);
        float insideY = step(gap, cellUV.y) * step(cellUV.y, 1.0 - gap);
        float inside = insideX * insideY;  // 1.0 if inside, 0.0 if in the gap

        // Remap the UV so that the texture is sampled from the inner portion of the cell.
        vec2 remappedUV = (cellUV - gap) / (1.0 - 2.0 * gap);

        // Sample the texture from the remapped UV.
        vec4 gridSample = texture2D(u_texture, remappedUV);

        // Set the gap color to be fully transparent.
        vec4 gapColor = vec4(0.0, 0.0, 0.0, 0.0);

        // Mix the texture with the gap color.
        // Fragments inside the cell get the texture; fragments in the gap get transparency.
        vec4 img = mix(gapColor, gridSample, inside);


        // vec4 img = texture2D(u_texture, st);

        vec4 color = vec4(1.0);

        
        vec2 bl = smoothstep(vec2(1.0, 0.0),vec2(0.0, 0.1 ), st);
        vec2 tr = smoothstep(vec2(0.0, 1.0),vec2(1., 1. - sin(u_time)), 1. - st);

        // The multiplication of left*bottom will be similar to the logical AND.
        // vec3 sides = vec3(left * bottom * right * top );

        // vec3 sides = vec3(bl.x * tr.x * tr.y * bl.y);
        // color = vec4( sides, 1.0 );

        // Calculate the mask using bl and tr to make white transparent and black opaque
        float mask = bl.x * tr.x * bl.y * tr.y;  // Intersection of the box sides

        // Make the color transparent if it's white (mask == 1), opaque if it's black (mask == 0)
        // color = vec4(img.rgb, mask);

        // Use a continuous triangle wave for progress instead of a plateau
        float progress = 1.0 - abs(2.0 * t - 1.0);
        progress = smoothstep(0.0, 1.0, progress); // additional smoothing if desired

        // Adjust width if needed for an even gentler transition
        float width = 0.1;
        float height = 0.1;

        // Instead of directly using smoothstep for the right edge,
        // compute a normalized value then apply a custom ease (easeInOutQuad here)
        float x = clamp((st.x - (progress - width)) / width, 0.0, 1.0);
        float y = clamp((st.y - (progress - height)) / height, 0.0, 1.0);
        
        float easedY = (y < 0.0)
            ? (10. * y * y)
            : (1.0 - pow(-10. * y + 10., 10.) / 10.);

        float easedX = (x < 0.0)
            ? (10. * x * x)
            : (1.0 - pow(-10. * x + 10., 10.) / 10.);


        // float opacity = 1.0 - (easedX + easedY);
        float opacity = 1.0 - (easedX);
        float finalOpacity = opacity * inside;

        gl_FragColor = vec4(img.rgb, finalOpacity);

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

    const [curve] = useState(() => {
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
        <ScrollControls>
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
        </ScrollControls>
        </>
    );
};

const ImageShaderPopup2 = () => {

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

export default ImageShaderPopup2;
