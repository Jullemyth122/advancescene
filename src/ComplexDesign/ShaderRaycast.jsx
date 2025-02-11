import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'

const fragmentShader = `
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    varying vec2 vUv;

    #define MAX_STEPS 100
    #define MAX_DIST 100.0
    #define SURFACE_DIST 0.001

    float sphereSDF(vec3 p, float r) {
        return length(p) - r;
    }

    float sceneSDF(vec3 p) {
        vec3 spherePos = vec3((u_mouse - 0.5) * 4.0, 0.0);
        return sphereSDF(p - spherePos, 1.0);
    }

    vec3 getNormal(vec3 p) {
        float d = sceneSDF(p);
        vec2 e = vec2(0.001, 0.0);
        vec3 n = d - vec3(
            sceneSDF(p - e.xyy),
            sceneSDF(p - e.yxy),
            sceneSDF(p - e.yyx)
        );
        return normalize(n);
    }

    float rayMarch(vec3 ro, vec3 rd) {
        float dO = 0.0;
        for(int i = 0; i < MAX_STEPS; i++) {
            vec3 p = ro + rd * dO;
            float dS = sceneSDF(p);
            if(dS < SURFACE_DIST) {
                return dO;
            }
            dO += dS;
            if(dO > MAX_DIST) break;
        }
        return dO;
    }

    void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        vec3 ro = vec3(0.0, 0.0, 5.0);
        vec3 rd = normalize(vec3(uv, -1.0));
        
        float d = rayMarch(ro, rd);
        vec3 color = vec3(0.0);
        
        if(d < MAX_DIST) {
            vec3 p = ro + rd * d;
            vec3 normal = getNormal(p);
            vec3 lightDir = normalize(vec3(0.5, 0.8, -1.0));
            float diff = clamp(dot(normal, lightDir), 0.0, 1.0);
            color = vec3(diff);
        }
        
        gl_FragColor = vec4(color, 1.0);
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

    const shadersRef = useRef(null);

    // Setup uniforms: we initialize resolution, time and mouse.
    const uniforms = useMemo(() => ({
        u_time: { value: 0.0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    }), [])

    // Update uniforms each frame.
    useFrame(({ clock, size, pointer }) => {
        uniforms.u_time.value = clock.getElapsedTime()
        uniforms.u_resolution.value.set(size.width, size.height)
        // pointer is in [-1, 1]; convert to [0,1]
        uniforms.u_mouse.value.x = (pointer.x + 1) * 0.5
        uniforms.u_mouse.value.y = (pointer.y + 1) * 0.5
    })

    return(<>
    
        <mesh position={[0,0,0]} rotation={[0,0,0]}>
            <planeGeometry args={[1,1,64,64]} />
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
            
            
            {/* Directional light simulates sunlight */}
            <directionalLight
            castShadow
            intensity={1}
            position={[5, 5, 2]}
            color="white"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            />
            
            {/* Spot light adds a colored accent */}
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