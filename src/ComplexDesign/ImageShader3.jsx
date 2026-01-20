import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import "./imgshdr.scss";
import { OrbitControls, ScrollControls, useScroll, Scroll } from "@react-three/drei";
import gsap from "gsap";
import { useEffect } from "react";
import { ScrollTrigger } from "gsap/all";

const fragmentShader = `
    uniform sampler2D u_texture1; 
    uniform sampler2D u_texture2; 
    uniform sampler2D u_texture3;
    uniform sampler2D u_texture4;
    uniform sampler2D u_texture5;

    varying vec2 vUv;
    uniform vec2 u_resolution; 
    uniform float u_time;

    void main() {
        vec2 st = vUv;
        
        // Each texture shows for 5 seconds
        float cycleTime = 5.0;
        float t = fract(u_time / cycleTime);
        
        // 'progress' is a value (0..1) that oscillates over a cycle.
        float progress = 1.0 - abs(2.0 * t - 1.0);
        progress = smoothstep(0.0, 1.0, progress);
        
        // Define a symmetric transition band around 'progress'
        float band = 0.1; // half-width of the transition zone
        
        // alpha is 1 when st.x is in [progress - band, progress + band] and falls off smoothly outside.
        float alpha = smoothstep(progress - band, progress, st.x) *
                    (1.0 - smoothstep(progress, progress + band, st.x));
        
        // Determine which texture to use based on cycle count:
        float n = floor(u_time / cycleTime);
        int currentIndex = int(mod(n, 5.0));
        int nextIndex = int(mod(n + 1.0, 5.0));
        float blend = smoothstep(0.9, 1.0, t); // Blend near cycle end

        vec4 currentImg, nextImg;
        if (currentIndex == 0) currentImg = texture2D(u_texture1, st);
        else if (currentIndex == 1) currentImg = texture2D(u_texture2, st);
        else if (currentIndex == 2) currentImg = texture2D(u_texture3, st);
        else if (currentIndex == 3) currentImg = texture2D(u_texture4, st);
        else currentImg = texture2D(u_texture5, st);

        if (nextIndex == 0) nextImg = texture2D(u_texture1, st);
        else if (nextIndex == 1) nextImg = texture2D(u_texture2, st);
        else if (nextIndex == 2) nextImg = texture2D(u_texture3, st);
        else if (nextIndex == 3) nextImg = texture2D(u_texture4, st);
        else nextImg = texture2D(u_texture5, st);

        vec4 img = mix(currentImg, nextImg, blend);
        gl_FragColor = vec4(img.rgb, alpha);
    }

`;



const vertexShader = `
    uniform float u_time;
    varying vec2 vUv;

    void main() {
        vUv = uv;
        // Compute world-space position
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec3 pos = modelPosition.xyz;
        
        // Define the crease along y = 0 (adjust if your geometry isn’t centered)
        float crease = 0.0;

        float cycleTime = 5.0;
        float t = fract(u_time / cycleTime);


        // Maximum fold angle set to 180 degrees for a full fold
        float maxAngle = 3.1416; // π radians
        // Oscillating fold angle between 0 and maxAngle
        float foldAngle = abs(sin(t * 2.0)) * maxAngle;
        
        // Distance from the crease
        float d = abs(pos.y - crease);
        // Max distance for the fold effect (adjust based on geometry size)
        float maxDistance = 1.0;
        // Smooth transition weight
        float weight = smoothstep(0.0, maxDistance, d);
        // Angle applied to this vertex
        float currentAngle = weight * foldAngle;
        
        // Apply rotation around the x-axis based on position relative to crease
        if (pos.y > crease) {
            // Top half: rotate downward
            vec3 offset = pos - vec3(0.0, crease, 0.0);
            mat3 rot = mat3(
                1.0,          0.0,           0.0,
                0.0,  cos(-currentAngle), -sin(-currentAngle),
                0.0,  sin(-currentAngle),  cos(-currentAngle)
            );
            pos = vec3(0.0, crease, 0.0) + rot * offset;
        } else {
            // Bottom half: rotate upward
            vec3 offset = pos - vec3(0.0, crease, 0.0);
            mat3 rot = mat3(
                1.0,          0.0,          0.0,
                0.0,  cos(currentAngle), -sin(currentAngle),
                0.0,  sin(currentAngle),  cos(currentAngle)
            );
            pos = vec3(0.0, crease, 0.0) + rot * offset;
        }
        
        // Update position and transform to clip space
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
                <shaderMaterial
                    transparent={true}
                    ref={shadersRef}
                    depthWrite={false} // Add this

                    uniforms={data}
                    // wireframe={true}
                    fragmentShader={fragmentShader}
                    vertexShader={vertexShader}
                    side={THREE.FrontSide}
                />
            </mesh>
        </>
    );
};

const ImageShader3 = () => {


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
            {/* <OrbitControls /> */}
            </Canvas>
        </div>
        <div style={{ height: "850vh", position: 'absolute', zIndex:'10' }}>
            <h1> Julle Myth M. Vicentillo </h1>
        </div>
    </div>
  );
};

export default ImageShader3;
