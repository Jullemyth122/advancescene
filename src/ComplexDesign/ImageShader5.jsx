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
varying vec2 vUv;
uniform float u_time;

float circle(vec2 uv, vec2 pos, float radius, float blur, float t) {
    
    // float d = distance(uv, pos);

    vec2 v = uv - pos;
    float d = length(v);
    // float d = sqrt(v.x * v.x + v.y * v.y);
    
    return smoothstep(radius, radius - blur, d);
}

void main() {

    float cycleTime = 5.0;
    float t = fract(u_time / cycleTime);

    vec2 currentUV = vUv;

    currentUV = fract(currentUV * 3.0);
    
    float d = fract( length(currentUV ) * 5.0);

    mat2 aMat2 = mat2(d / u_time, d,  // 1. column
                  0.0, 1.0); // 2. column

    // float b = abs(fract(length(currentUV + sin(t * 2.0)) * u_time ));

    // float a = dot(currentUV.x * b, currentUV.y + b);
    float a = dot(currentUV.x * sin(t * 2.0) , currentUV.y / sin(t));
    currentUV = vec2(currentUV.x , currentUV.y) * aMat2;


    vec4 img = texture2D(u_texture1, currentUV);


    gl_FragColor = vec4( img.rgb, 1.0);
    // gl_FragColor.r = -1.0/12.0;
    // gl_FragColor = vec4()
    // gl_FragColor = vec4(img.rgb, d);
    // gl_FragColor = vec4(img.rgb, (d + b));
}
`;



const vertexShader = `
    uniform float u_time;
    varying vec2 vUv;

    void main() {
        vUv = uv;

        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

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
                <planeGeometry args={[1,1.,64,64]} />
                {/* <tubeGeometry args={[curve, 70, 5 ,50,false]}/> */}
                <shaderMaterial
                    transparent={true}
                    ref={shadersRef}
                    depthWrite={false} // Add this

                    uniforms={data}
                    // wireframe={true}
                    fragmentShader={fragmentShader}
                    vertexShader={vertexShader}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </>
    );
};

const ImageShader5 = () => {


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

export default ImageShader5;
