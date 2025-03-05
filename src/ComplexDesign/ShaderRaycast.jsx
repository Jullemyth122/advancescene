import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'

const fragmentShader = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    // Uniforms passed from JavaScript:
    uniform vec2 u_resolution; // Canvas size (pixels)
    uniform float u_time;      // Time (in seconds)
    uniform vec2 u_mouseUV;     // Mouse position in UV space ([0,1])

    // vUv contains the interpolated UV coordinates (from 0 to 1) of each fragment.
    varying vec2 vUv;

    // ----------------------------------------------------------------
    // SDF for a box: returns the signed distance from point p to the surface of a box
    // with half-dimensions given by b.
    float boxSDF(vec3 p, vec3 b) {
        vec3 d = abs(p) - b;
        // Outside distance + inside (negative) correction.
        return length(max(d, vec3(0.0))) + min(max(d.x, max(d.y, d.z)), 0.0);
    }

    // ----------------------------------------------------------------
    // Simple raymarching function: starting from ray origin 'ro' along direction 'rd',
    // march along the ray until the surface (distance < MIN_DIST) is hit or max distance is exceeded.
    float rayMarch(vec3 ro, vec3 rd) {
        float t = 0.0;                   // Total distance traveled along the ray
        const int MAX_STEPS = 64;        // Maximum number of steps
        const float MIN_DIST = 0.01;     // Hit threshold: if distance is smaller than this, we consider it a hit.
        const float MAX_DIST = 20.0;     // Maximum distance to march
        
        // March along the ray in fixed steps
        for (int i = 0; i < MAX_STEPS; i++) {
            vec3 pos = ro + rd * t;          // Current position along the ray
            float d = boxSDF(pos, vec3(1.0));  // Distance to our box (box half-size = 1.0)
            if (d < MIN_DIST) break;         // Surface hit: exit loop
            t += d;                          // Advance by the distance d
            if (t > MAX_DIST) break;         // Exceeded max distance: exit loop
        }
        return t;
    }

    // ----------------------------------------------------------------
    // Main function: sets up the camera ray and performs raymarching
    void main() {
        // Convert pixel coordinates to normalized [0,1] uv coordinates.
        // (Alternatively, you could use vUv if your vertex shader passes it directly.)
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        
        // Convert uv to range [-1,1] and adjust the x-coordinate by the aspect ratio.
        vec2 p = (uv - 0.5) * 2.0;
        p.x *= u_resolution.x / u_resolution.y;
        
        // --- Setup camera ---
        // Camera (ray origin) positioned at z = 5.0.
        // vec3 ro = vec3(0.0, 0.0, 5.0);
        vec2 mouseOffset = (u_mouseUV - vec2(0.5)) * 5.0;
        vec3 ro = vec3(mouseOffset.x, 5.0, 10.0);


        // Ray direction: pointing from the camera through the pixel.
        vec3 rd = normalize(vec3(p, -1.0)); // Here, -1.0 defines a fixed focal length.
        
        // --- Raymarching ---
        float t = rayMarch(ro, rd);
        
        // --- Simple shading ---
        // If we hit the box (i.e. the ray marched less than MAX_DIST), compute a simple shade.
        vec3 col;
        if (t < 20.0) {
            // Shade based on the distance: closer hit results in brighter color.
            // col = vec3(1.0 - t / 5.0);
            col = vec3(1.0 - t / 10.0);
        } else {
            // Background color if nothing is hit.
            // col = vec3(0.1, 0.2, 0.3);
            col = vec3(0.);
        }
        
        // Output the final color.
        gl_FragColor = vec4(col, 1.0);
    }


`

const vertexShader = `

    uniform float u_time;
    varying vec2 vUv;
    
    void main() {

        vUv = uv;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);


    }
`;

const RayCastingShader = () => {


    const meshRef = useRef()
    const shadersRef = useRef(null)
    const { camera, pointer, scene } = useThree()
    const raycaster = new THREE.Raycaster()
  
    // Setup uniforms: note that u_colors is mis-declared; use Vector3 for a color
    const uniforms = useMemo(() => ({
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
        u_mouseUV: { value: new THREE.Vector2(0.0, 1.0) },
        u_threshold: { value: 0.2 },
        u_circleRadius: { value: 1.0 }  // set to 1.0 or 2.0 as needed
    }), []);

  
    useFrame(({ clock, size }) => {
        uniforms.u_time.value = clock.getElapsedTime()
        uniforms.u_resolution.value.set(size.width, size.height)
        // Update the global mouse uniform (if needed)
        uniforms.u_mouse.value.x = (pointer.x + 1) * 0.5
        uniforms.u_mouse.value.y = (pointer.y + 1) * 0.5
    
        // Perform a raycast from the pointer onto the plane
        raycaster.setFromCamera(pointer, camera)
        const intersects = raycaster.intersectObject(meshRef.current)
        if (intersects.length > 0) {
            // Use the intersected UV coordinate and update u_mouseUV
            uniforms.u_mouseUV.value.copy(intersects[0].uv)
        }
    })

    return(<>
    
        <mesh position={[0,0,0]} rotation={[0,0,0]} ref={ meshRef }>
            <planeGeometry args={[4,4,64,64]} />
            <shaderMaterial
                transparent={true}
                ref={shadersRef}
                uniforms={uniforms}
                // wireframe={true}
                fragmentShader={fragmentShader}
                vertexShader={vertexShader}
                side={THREE.DoubleSide}
            ></shaderMaterial>
        </mesh>
    </>)
}

const Stage = () => {
    return (
        <mesh 
            rotation={[-Math.PI / 2, 0 ,0]}
            position={[0,-2,0]}
            castShadow receiveShadow>
            <planeGeometry args={[10,10,64]}></planeGeometry>
            <meshStandardMaterial
                roughness={0.65}
                color={"white"}
                reflectivity={1}
                vertexColors={"#ffcffc"}
            />
        </mesh>
    )
}

const Scene = () => {
    



    return(
        <>
            <ambientLight intensity={0.5} />
            
            
            <directionalLight
                castShadow
                intensity={1}
                position={[5, 5, 2]}
                color="white"
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            
            <spotLight
                castShadow
                intensity={1}
                position={[-5, 5, 2]}
                angle={0.3}
                penumbra={0.5}
                color="pink"
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />

            <directionalLight
                castShadow
                intensity={1}
                position={[5, 5, -2]}
                color="white"
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            
            <spotLight
                castShadow
                intensity={1}
                position={[-5, 5, -2]}
                angle={0.3}
                penumbra={0.5}
                color="pink"
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            
            <RayCastingShader/>

            <Stage/>


        
        </>
    )
}

const ShaderRaycast = () => {
    return (
        <div className='mirror-comp'>
            <Canvas 
                className='three-canvas' camera={[0, 0, 8]}
                flat shadows
                gl={{ antialias:true }}    
            >
                <Scene
                />
                <OrbitControls/>
            </Canvas>

        </div>
    )
}

export default ShaderRaycast