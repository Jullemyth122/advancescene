import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./imgshdr.scss";
import { OrbitControls, ScrollControls, useScroll, Scroll } from "@react-three/drei";
import gsap from "gsap";
import { useEffect } from "react";
import { ScrollTrigger } from "gsap/all";

const fragmentShader = `
// uniform sampler2D u_texture1; 
// uniform sampler2D u_texture2; 
// uniform sampler2D u_texture3;
// uniform sampler2D u_texture4;
// uniform sampler2D u_texture5;

// varying vec2 vUv;
// uniform vec2 u_resolution; 
// uniform float u_time;

// void main() {
//     vec2 st = vUv;
    
//     // Define the cycle time (each texture shows for 5 seconds)
//     float cycleTime = 5.0;
//     // 't' still drives your original animation, within one cycle [0,1]
//     float t = fract(u_time / cycleTime);
    
//     // Original animation code (for progress and opacity)
//     vec4 color = vec4(1.0);
//     float progress = 1.0 - abs(2.0 * t - 1.0);
//     progress = smoothstep(0.0, 1.0, progress);
//     float width = 0.1;
//     float height = 0.1;
//     float x = clamp((st.x - (progress - width)) / width, 0.0, 1.0);
//     float y = clamp((st.y - (progress - height)) / height, 0.0, 1.0);
    
//     float easedX = (x < 0.0)
//         ? (10.0 * x * x)
//         : (1.0 - pow(-10.0 * x + 10.0, 10.0) / 10.0);

//     float opacity = 1.0 - easedX;

//     // float easedX = smoothstep(0.0, 1.0, x); // Simple smooth transition
//     // float opacity = easedX; // Fade in from left to right (0 to 1)




    
//     // Determine which cycle we're in (each cycle is cycleTime seconds)
//     float n = floor(u_time / cycleTime);
//     // Use modulo 5 to choose between the three textures:
//     int textureIndex = int(mod(n, 5.0));
    
//     vec4 img;
//     if (textureIndex == 0) {
//         img = texture2D(u_texture1, st);
//     } else if (textureIndex == 1) {
//         img = texture2D(u_texture2, st);
//     } else if(textureIndex == 2) {
//         img = texture2D(u_texture3, st);
//     } else if(textureIndex == 3) {
//         img = texture2D(u_texture4, st);
//     } else if(textureIndex == 4) {
//         img = texture2D(u_texture5, st);
//     }
    
//     gl_FragColor = vec4(img.rgb, opacity);
// }

    uniform sampler2D u_texture1; 
    uniform sampler2D u_texture2; 
    uniform sampler2D u_texture3;
    uniform sampler2D u_texture4;
    uniform sampler2D u_texture5;
    varying vec2 vUv;
    uniform float u_time;

    vec4 getTexture(int index, vec2 uv) {
        if (index == 0) return texture2D(u_texture1, uv);
        else if (index == 1) return texture2D(u_texture2, uv);
        else if (index == 2) return texture2D(u_texture3, uv);
        else if (index == 3) return texture2D(u_texture4, uv);
        else return texture2D(u_texture5, uv);
    }

    void main() {
        // Flip UV horizontally for back face
        vec2 st = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
        float cycleTime = 5.0;
        float t = fract(u_time / cycleTime);
        float transitionDuration = 1.0; // Note: 1.0 means full cycle transition
        
        int currentIndex = int(mod(floor(u_time / cycleTime), 5.0));
        int previousIndex = int(mod(float(currentIndex - 1), 5.0));
        
        if (t < transitionDuration) {
            float progress = t / transitionDuration;
            vec2 center = vec2(0.5, 0.5);
            float dist = length(st - center);
            float mask = smoothstep(0.0, 1.0, (progress - dist) / 0.1);
            
            vec4 previousImg = getTexture(previousIndex, st);
            vec4 currentImg = getTexture(currentIndex, st);
            gl_FragColor = mix(previousImg, currentImg, mask);
        } else {
            vec4 currentImg = getTexture(currentIndex, st);
            gl_FragColor = currentImg;
        }
    }
`;


const vertexShader = `
    // uniform float u_time;
    // varying vec2 vUv;

    // void main() {
    //     vUv = uv;
    //     // Compute world-space position
    //     vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    //     vec3 pos = modelPosition.xyz;
        
    //     // Define the crease along y = 0 (adjust if your geometry isn’t centered)
    //     float crease = 0.0;

    //     float cycleTime = 5.0;
    //     float t = fract(u_time / cycleTime);


    //     // Maximum fold angle set to 180 degrees for a full fold
    //     float maxAngle = 3.1416; // π radians
    //     // Oscillating fold angle between 0 and maxAngle
    //     float foldAngle = abs(sin(t * 2.0)) * maxAngle;
        
    //     // Distance from the crease
    //     float d = abs(pos.y - crease);
    //     // Max distance for the fold effect (adjust based on geometry size)
    //     float maxDistance = 1.0;
    //     // Smooth transition weight
    //     float weight = smoothstep(0.0, maxDistance, d);
    //     // Angle applied to this vertex
    //     float currentAngle = weight * foldAngle;
        
    //     // Apply rotation around the x-axis based on position relative to crease
    //     if (pos.y > crease) {
    //         // Top half: rotate downward
    //         vec3 offset = pos - vec3(0.0, crease, 0.0);
    //         mat3 rot = mat3(
    //             1.0,          0.0,           0.0,
    //             0.0,  cos(-currentAngle), -sin(-currentAngle),
    //             0.0,  sin(-currentAngle),  cos(-currentAngle)
    //         );
    //         pos = vec3(0.0, crease, 0.0) + rot * offset;
    //     } else {
    //         // Bottom half: rotate upward
    //         vec3 offset = pos - vec3(0.0, crease, 0.0);
    //         mat3 rot = mat3(
    //             1.0,          0.0,          0.0,
    //             0.0,  cos(currentAngle), -sin(currentAngle),
    //             0.0,  sin(currentAngle),  cos(currentAngle)
    //         );
    //         pos = vec3(0.0, crease, 0.0) + rot * offset;
    //     }
        
    //     // Update position and transform to clip space
    //     modelPosition.xyz = pos;
    //     gl_Position = projectionMatrix * viewMatrix * modelPosition;
    // }

    uniform float u_time;
    varying vec2 vUv;

    float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 15.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float smoothInterp(float t) {
        return t * t * (3.0 - 2.0 * t);
    }

    float snoise(vec3 v) {
        vec3 i = floor(v);
        vec3 f = fract(v);
        
        float n000 = hash(i);
        float n001 = hash(i + vec3(0.0, 0.0, 1.0));
        float n010 = hash(i + vec3(0.0, 1.0, 0.0));
        float n011 = hash(i + vec3(0.0, 1.0, 1.0));
        float n100 = hash(i + vec3(1.0, 0.0, 0.0));
        float n101 = hash(i + vec3(1.0, 0.0, 1.0));
        float n110 = hash(i + vec3(1.0, 1.0, 0.0));
        float n111 = hash(i + vec3(1.0, 1.0, 1.0));
        
        float n00 = mix(n000, n100, smoothInterp(f.x));
        float n01 = mix(n001, n101, smoothInterp(f.x));
        float n10 = mix(n010, n110, smoothInterp(f.x));
        float n11 = mix(n011, n111, smoothInterp(f.x));
        
        float n0 = mix(n00, n10, smoothInterp(f.y));
        float n1 = mix(n01, n11, smoothInterp(f.y));
        
        return mix(n0, n1, smoothInterp(f.z));
    }

    void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec3 pos = modelPosition.xyz;
        
        float crease = 0.;
        float cycleTime = 5.0;
        float t = fract(u_time / cycleTime);
        float maxAngle = 3.1416 / 2.0;

        // Add noise to create organic variation
        float noise = snoise(vec3(pos.x * 5.0, pos.y * 5.0, u_time * 0.5));
        float foldAngle = abs(sin(t * 2.0)) * maxAngle + noise * 0.8; // Noise amplitude of 0.2
        
        float d = abs(pos.y - crease);
        float maxDistance = 0.95;
        float weight = smoothstep(0.0, maxDistance, d);
        float currentAngle = weight * foldAngle;
        
        if (pos.y > crease) {
            vec3 offset = pos - vec3(0.0, crease, 0.0);
            mat3 rot = mat3(
                1.0, 0.0, 0.0,
                0.0, cos(-currentAngle), -sin(-currentAngle),
                0.0, sin(-currentAngle), cos(-currentAngle)
            );
            pos = vec3(0.0, crease, 0.0) + rot * offset;
        } else {
            vec3 offset = pos - vec3(0.0, crease, 0.0);
            mat3 rot = mat3(
                1.0, 0.0, 0.0,
                0.0, cos(currentAngle), -sin(currentAngle),
                0.0, sin(currentAngle), cos(currentAngle)
            );
            pos = vec3(0.0, crease, 0.0) + rot * offset;
        }
        
        modelPosition.xyz = pos;
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
    
`;



const useVideoTexture = (src) => {
    return useMemo(() => {
        const video = document.createElement("video");
        video.src = src;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.play(); // start playback immediately
        return new THREE.VideoTexture(video);
    }, [src]);
};

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
    // const texture1 = useLoader(THREE.TextureLoader, "./img/samp1.gif");
    // const texture2 = useLoader(THREE.TextureLoader, "./img/samp2.gif");
    // const texture3 = useLoader(THREE.TextureLoader, "./img/samp3.gif");
    // const texture4 = useLoader(THREE.TextureLoader, "./img/samp4.gif");
    // const texture5 = useLoader(THREE.TextureLoader, "./img/samp5.gif");


   // Load five video textures converted from your GIF files.
    const texture1 = useVideoTexture("./img/samp1.mp4");
    const texture2 = useVideoTexture("./img/samp2.mp4");
    const texture3 = useVideoTexture("./img/samp3.mp4");
    const texture4 = useVideoTexture("./img/samp4.mp4");
    const texture5 = useVideoTexture("./img/samp5.mp4");

    const data = useMemo(
        () => ({
            u_texture1: { type: "t", value: texture1 },
            u_texture2: { type: "t", value: texture2 },
            u_texture3: { type: "t", value: texture3 },
            u_texture4: { type: "t", value: texture4 },
            u_texture5: { type: "t", value: texture5 },
            u_time: { type: "f", value: 0.0 },
            u_resolution: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
            transform: { value: new THREE.Vector3(0, 0, 0) },
        }),
        [texture1, texture2, texture3, texture4, texture5]
    );

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        if (!shadersRef.current) return;
        gsap.to(shadersRef.current.uniforms.u_time, {
            value: 5.0 * 2.0 * 5.0, // 5.0 * 2.0 is the cycle time for the whoel shader and 5.0 is for 5 textures..... 
            ease: "none",
            scrollTrigger: {
                pin: true,
                // markers: true,
                trigger: ".layer-canv",
                start: "top top",
                end: "+=750%", // 300%(2), 480%(3), 750% (5),
                scrub: 1,
                // onUpdate: (self) => {
                //     console.log("Scroll percentage:", self.progress * 100 + "%");
                //     console.log("u_time:", self.progress * 5.0);
                // },
            },
        });
    }, []);

    return (
        <>
            <ambientLight />
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                <planeGeometry args={[2,1.,64,64]} />
                {/* <tubeGeometry args={[curve, 70, 5 ,50,false]}/> */}
                {/* <shaderMaterial
                    transparent={false}
                    ref={shadersRef}
                    depthWrite={false} // Add this
                    // depthWrite={true} // Add this

                    uniforms={data}
                    // wireframe={true}
                    fragmentShader={fragmentShader}
                    vertexShader={vertexShader}
                    side={THREE.FrontSide}
                /> */}
                <shaderMaterial
                    transparent={false}
                    ref={shadersRef}
                    depthWrite={true}  // Enable depth writing for correct overlapping
                    uniforms={data}
                    fragmentShader={fragmentShader}
                    vertexShader={vertexShader}
                    side={THREE.DoubleSide}  // Render both front and back faces
                />
            </mesh>
        </>
    );
};

const ImageShader2 = () => {


  return (
    <div className="img-shader-comp">
        <div className="layer-canv">
            <Canvas
                className="three-canvas"
                flat
                gl={{ antialias: true }}
                camera={{ position: [0, 0, 1.] }}
            >
            <Scene />
            <OrbitControls />
            </Canvas>
        </div>
        <div style={{ height: "850vh", position: 'absolute', zIndex:'10' }}>
            <h1> Julle Myth M. Vicentillo </h1>
        </div>
    </div>
  );
};

export default ImageShader2;
