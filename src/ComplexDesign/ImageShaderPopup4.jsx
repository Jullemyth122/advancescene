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
    uniform vec2 mouse;

    // SDF Functions from the First Shader
    float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0);
        return min(a, b) - h * h * 0.25 / k;
    }

    float smax(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0);
        return max(a, b) + h * h * 0.25 / k;
    }

    float sdSphere(vec3 p, float s) {
        return length(p) - s;
    }

    float sdEllipsoid(vec3 p, vec3 r) {
        float k0 = length(p / r);
        float k1 = length(p / (r * r));
        return k0 * (k0 - 1.0) / k1;
    }

    vec2 sdStick(vec3 p, vec3 a, vec3 b, float r1, float r2) {
        vec3 pa = p - a, ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return vec2(length(pa - ba * h) - mix(r1, r2, h * h * (3.0 - 2.0 * h)), h);
    }

    vec4 opU(vec4 d1, vec4 d2) {
        return (d1.x < d2.x) ? d1 : d2;
    }

    // Global variables for map function
    float href;
    float hsha;

    // Map Function from the First Shader (Adapted)
    vec4 map(in vec3 pos, float atime) {
        hsha = 1.0;
        
        float t1 = fract(atime);
        float t4 = abs(fract(atime * 0.5) - 0.5) / 0.5;

        float p = 4.0 * t1 * (1.0 - t1);
        float pp = 4.0 * (1.0 - 2.0 * t1);

        vec3 cen = vec3(0.5 * (-1.0 + 2.0 * t4), pow(p, 2.0 - p) + 0.1, floor(atime) + pow(t1, 0.7) - 1.0);

        vec2 uu = normalize(vec2(1.0, -pp));
        vec2 vv = vec2(-uu.y, uu.x);
        
        float sy = 0.5 + 0.5 * p;
        float compress = 1.0 - smoothstep(0.0, 0.4, p);
        sy = sy * (1.0 - compress) + compress;
        float sz = 1.0 / sy;

        vec3 q = pos - cen;
        float rot = -0.25 * (-1.0 + 2.0 * t4);
        float rc = cos(rot);
        float rs = sin(rot);
        q.xy = mat2(rc, rs, -rs, rc) * q.xy;
        vec3 r = q;
        href = q.y;
        q.yz = vec2(dot(uu, q.yz), dot(vv, q.yz));
        
        float deli = sdEllipsoid(q, vec3(0.25, 0.25 * sy, 0.25 * sz));
        vec4 res = vec4(deli, 2.0, 0.0, 1.0);

        // Ground
        float fh = -0.1 - 0.05 * (sin(pos.x * 2.0) + sin(pos.z * 2.0));
        float d = pos.y - fh;
        
        // Bubbles (simplified for brevity; full version can be copied from the first shader)
        vec3 vp = vec3(mod(abs(pos.x), 3.0) - 1.5, pos.y, mod(pos.z + 1.5, 3.0) - 1.5);
        float d2 = sdEllipsoid(vp - vec3(0.5, 0.0, 0.0), vec3(0.7, 1.0, 0.7));
        d = smin(d, d2, 0.32);
        if (d < res.x) { res = vec4(d, 1.0, 0.0, 1.0); }

        // Add more elements (head, arms, etc.) from the first shader’s map function as needed

        return res;
    }

    // Raycasting from the First Shader
    vec4 raycast(in vec3 ro, in vec3 rd, float time) {
        vec4 res = vec4(-1.0, -1.0, 0.0, 1.0);
        float tmin = 0.5;
        float tmax = 20.0;
        float t = tmin;
        for (int i = 0; i < 256 && t < tmax; i++) {
            vec4 h = map(ro + rd * t, time);
            if (abs(h.x) < (0.0005 * t)) {
                res = vec4(t, h.yzw);
                break;
            }
            t += h.x;
        }
        return res;
    }

    // Normal Calculation from the First Shader
    vec3 calcNormal(in vec3 pos, float time) {
        vec3 n = vec3(0.0);
        for (int i = 0; i < 4; i++) {
            vec3 e = 0.5773 * (2.0 * vec3((((i + 3) >> 1) & 1), ((i >> 1) & 1), (i & 1)) - 1.0);
            n += e * map(pos + 0.001 * e, time).x;
        }
        return normalize(n);
    }

    // Soft Shadows from the First Shader
    float calcSoftshadow(in vec3 ro, in vec3 rd, float time) {
        float res = 1.0;
        float tmax = 12.0;
        float t = 0.02;
        for (int i = 0; i < 50; i++) {
            float h = map(ro + rd * t, time).x;
            res = min(res, mix(1.0, 16.0 * h / t, hsha));
            t += clamp(h, 0.05, 0.40);
            if (res < 0.005 || t > tmax) break;
        }
        return clamp(res, 0.0, 1.0);
    }

    // Render Function from the First Shader (Simplified)
    vec3 render(in vec3 ro, in vec3 rd, float time) {
        vec3 col = vec3(0.5, 0.8, 0.9) - max(rd.y, 0.0) * 0.5;
        vec4 res = raycast(ro, rd, time);
        if (res.y > -0.5) {
            float t = res.x;
            vec3 pos = ro + t * rd;
            vec3 nor = calcNormal(pos, time);
            
            col = vec3(0.2); // Default material
            if (res.y > 1.5) col = vec3(0.36, 0.1, 0.04); // Body
            
            vec3 sun_lig = normalize(vec3(0.6, 0.35, 0.5));
            float sun_dif = clamp(dot(nor, sun_lig), 0.0, 1.0);
            float sun_sha = calcSoftshadow(pos, sun_lig, time);
            float sky_dif = sqrt(clamp(0.5 + 0.5 * nor.y, 0.0, 1.0));
            
            vec3 lin = vec3(0.0);
            lin += sun_dif * vec3(8.10, 6.00, 4.20) * sun_sha;
            lin += sky_dif * vec3(0.50, 0.70, 1.00);
            col = col * lin;
            
            col = mix(col, vec3(0.5, 0.7, 0.9), 1.0 - exp(-0.0001 * t * t * t));
        }
        return col;
    }

    void main() {
        vec2 p = (2.0 * vUv - 1.0);
        p.x *= u_resolution.x / u_resolution.y;
        
        float an = 3.14 * mouse.x; // Mouse-controlled camera
        vec3 ta = vec3(0.0, 0.95, 5.);
        vec3 ro = ta + vec3(2.0 * sin(an), 0.0, 2.0 * cos(an));
        
        vec3 ww = normalize(ta - ro);
        vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
        vec3 vv = normalize(cross(uu, ww));
        vec3 rd = normalize(p.x * uu + p.y * vv + 1.8 * ww);
        
        vec3 col = render(ro, rd, u_time);
        col = pow(col, vec3(0.4545)); // Gamma correction
        
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


    // Define uniforms, including the mouse uniform
    const data = useMemo(
        () => ({
            u_texture: { type: "t", value: texture },
            u_time: { type: "f", value: 0.0 },
            u_resolution: { type: "v2", value: new THREE.Vector2(size.width, size.height) },
            mouse: { value: new THREE.Vector2(0.0, 0.0) }, // Add mouse uniform
            transform: { value: new THREE.Vector3(0, 0, 0) },
        }),
        [texture, size]
    );

    // Capture mouse movements
    const mouse = useRef(new THREE.Vector2(0, 0));

    useLayoutEffect(() => {
        const handleMouseMove = (event) => {
            // Normalize mouse coordinates to [0, 1] range (adjust as needed)
            mouse.current.x = event.clientX / size.width;
            mouse.current.y = 1.0 - event.clientY / size.height; // Invert Y-axis
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [size]);


    useFrame(({ clock }) => {
        if (shadersRef.current) {
            shadersRef.current.uniforms.u_time.value = clock.getElapsedTime();
            shadersRef.current.uniforms.mouse.value.set(mouse.current.x, mouse.current.y); // Update mouse uniform

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
                <planeGeometry args={[2,2,128,128]} />
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

const ImageShaderPopup4 = () => {


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

export default ImageShaderPopup4;
