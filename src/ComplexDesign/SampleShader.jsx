import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import './imgshdr.scss'
import { OrbitControls } from '@react-three/drei'

const fragmentShader = `

    vec3 colorA = vec3(0.008,0.895,0.940);
    vec3 colorB = vec3(0.129,0.299,1.000);

    uniform float u_time;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution; 
    #define PI 3.14159265358979323846 
    
    varying vec2 vUv;

    void main() {


        // vec4 img = texture2D(u_texture, vUv);

        // vec2 normalizedPixel = gl_FragCoord.xy/500.0;
        
        // vec3 color = mix(colorA, colorB, normalizedPixel.x);

        // vec3 texture = texture2D(u_texture, vUv).rgb;

        // gl_FragColor = vec4(texture,1.0);

        vec2 coord = vUv / u_resolution;
        vec3 color = vec3(0.0);

        // coord.x += sin(u_time);

        vec4 texColor = texture2D( u_texture, coord );
        texColor.r += 0.3;
        texColor.b += sin(u_time);
        texColor.g += 0.3;

        // gl_FragColor = vec4( texColor.rgb, 1.0 );
        gl_FragColor = vec4(texColor);

    }

`

const vertexShader = `
    uniform float u_time;
    varying vec2 vUv;
    void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        modelPosition.y += sin(modelPosition.x * 4.0 + u_time * 2.0) * 0.2;
        modelPosition.x += sin(modelPosition.y * 4.0 + u_time * 2.0) * 0.2;
        modelPosition.z += sin((modelPosition.y * 4.0 + modelPosition.x * 4.0) + u_time * 2.0) * 0.2;

        // Uncomment the code and hit the refresh button below for a more complex effect 🪄
        // modelPosition.y += sin(modelPosition.z * 6.0 + u_time * 2.0) * 0.1;

        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;

        // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`


export const Scene = () => {
    
    const shadersRef = useRef(null)

    const texture = useLoader(THREE.TextureLoader, '/img/hori.jpg');

    const data = useMemo(() => ({
        u_texture: {type:'t', value: texture },
        u_time: {type:'f', value: 0.0 },
        u_resolution: { type:'v2', value: new THREE.Vector2(0.0,0.0) },
    }),[texture])

    useFrame(({ clock }) => {
        if (shadersRef.current) {
            shadersRef.current.uniforms.u_time.value = clock.getElapsedTime();
        }
    });
    
    return (
        <>
            <ambientLight />
            <mesh position={[0,0,0]} rotation={[-Math.PI / 2 , 0, 0]}>
                <planeGeometry args={[1,1,16,16]} />
                <shaderMaterial
                    ref={shadersRef}
                    uniforms={data}
                    // wireframe={true}
                    fragmentShader={fragmentShader}
                    vertexShader={vertexShader}
                    side={THREE.DoubleSide}
                
                ></shaderMaterial>
                
            </mesh>
        </>
    )
}

const SampleShader = () => {

    return (
        <div className='img-shader-comp'>
            <Canvas 
                className='three-canvas' 
                flat gl={{ antialias:true }} 
                camera={{position: [0,0,2]}} 
            >
                <Scene/>
                <OrbitControls/>
            </Canvas>
        </div>
    )
}

export default SampleShader