import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Scroll, ScrollControls, useScroll } from '@react-three/drei'
import * as THREE from 'three'


const fragmentShader = `
    uniform sampler2D u_texture_l; // left texture
    uniform sampler2D u_texture_r; // right texture

    varying vec2 vUv;
    uniform vec2 u_resolution; 
    uniform float u_time;

    #define PHI 1.618034;
    #define TAU 6.283185;

    // Define the box position and size
    vec2 boxPosition = vec2(0.5, 0.3); // Bottom-left corner of the box (as a fraction of image size)
    vec2 boxSize = vec2(1.0, 0.4);     // Width and height of the box (as a fraction of image size)

    void main() {
        vec2 st = vUv;
        // In fragment shader it only focuses on colorization and single depth values.
        // the vec2 st is or the vUv is the 2D texture of coordinates
        
        // Adjust the gap size and number of boxes
        vec4 img = texture2D(u_texture_l, st); // Default texture

        vec4 color = vec4(0.0);

        // Loop through and create the boxes
        // vec4 color = vec4(1.0, 1.0, 1.0, 1.0) * img;

        // Each result will return 1.0 (white) or 0.0 (black).
        // float left = step(0.1, st.x);   // Similar to (X greater than 0.1)
        // float bottom = step(0.1, st.y); // Similar to (Y greater than 0.1)

        // float right = step(0.1, 1.0 - st.x); // Similar to (X smaller than 1.0)
        // float top = step(0.1, 1.0 - st.y); // Similar to (Y smaller than 1.0)

        // Step has a vector for x and y

        // Bottom Left 
        // How does it become a bottom-left? Because of the st - 0.1, because coordinates of st - n < m

        // describes like this bl => (1, 0), (1, 1), (0, 1)
        // (1, 0)        (0, 0)
        // _ _ _ _ _ _
        // |           |
        // |           |
        // |           |
        // | _ _ _ _ _ | (0,1)
        // (1, 1)

        // vec2 bl = step(vec2(0., 0.), st - 0.0);
        // vec2 tr = smoothstep(vec2(0.0, 1.0), vec2(1., 0.0), 1. - st);       
        // Top right because of that 1.0 - st, which coordinates are all in n - st > m
        // Top Right
        // vec2 tr = step(vec2(0., 0.), 1.0 - st);

        // The multiplication of left * bottom will be similar to the logical AND.
        // vec3 sides = vec3(left * bottom * right * top );

        // vec3 sides = vec3(bl.x * tr.x * tr.y * bl.y);
        // color = vec4(sides, 1.0);

        // Calculate the mask using bl and tr to make white transparent and black opaque
        // float mask = tr.x * tr.y * bl.x * bl.y;  // Intersection of the box sides

        // Make the color transparent if it's white (mask == 1), opaque if it's black (mask == 0)
        // color = vec4(img.rgb, mask);

        // Define the gap between the two images (set to 0.0 for no gap)
        float gap = 0.01;

        // Define the size of each image (each image takes half of the space minus the gap)
        float halfWidth = (1.0 - gap) * 0.5;
        float halfHeight = (1.0 - gap) * 1.0;

        // Initialize the color as transparent

        // If the fragment is on the left side, display the first image (left quadrant)
        if (st.x < halfWidth && st.y < halfHeight) {
            // Scale the UV coordinates to map the first image properly
            vec2 newSt = vec2(st.x / halfWidth, st.y / halfHeight);
            color = texture2D(u_texture_l, newSt); // Use the top-left texture
        }

        // If the fragment is on the right side, display the second image (right quadrant)
        else if (st.x > (halfWidth + gap) && st.y < halfHeight) {
            // Scale and shift the UV coordinates for the second image
            vec2 newSt = vec2((st.x - (halfWidth + gap)) / halfWidth, st.y / halfHeight);
            color = texture2D(u_texture_r, newSt); // Use the top-right texture
        }



        gl_FragColor = color;

        // gl_FragColor = vec4(color, 1.0);
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

        // model moves to the z (0,0,1), (0,0,2) --> 25th-position (  0,0,25 ) 
        vec4 modelPosition = modelMatrix * vec4(position,1.0);
        
        // modelPosition.z += cos((modelPosition.y * 4.0 + modelPosition.x * 4.0) + u_time * 2.0) * 0.2;

        float transitionFactor = smoothstep(0.0, 1.0, sin(u_time * 0.5));  // This creates a smooth oscillation from 0 to 1 over time

        // Apply animation based on the transition factor
        if (u_time > 0.0) {
            // Animated movement (cosine wave on the z-axis, controlled by the transitionFactor)
        }
        modelPosition.z += cos((modelPosition.y * 1.0 + (modelPosition.x / 2.0 + modelPosition.y) * 4.0) + u_time * 1.0) * 0.2 * transitionFactor;


        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;

        gl_Position = projectedPosition;

    }
`;

const Scene = () => {

    const meshRef = useRef()
    const shadersRef = useRef(null);
    const scroll = useScroll();

    // State to track the scroll offset value
    const [scrollOffset, setScrollOffset] = useState(scroll.offset);

    const numPages = 7; // Number of pages, and hence number of meshes
    const meshesRef = useRef([]); // Reference to hold all mesh refs

    useEffect(() => {
        meshesRef.current = meshesRef.current.slice(0, numPages); // Make sure the refs array length is equal to the number of meshes
    }, [numPages]);

    // Update scrollOffset when scroll changes
    useEffect(() => {
        setScrollOffset(scroll.offset);  // Update the state with the current scroll offset
    }, [scroll.offset]);  // This will run every time scroll.offset changes

    // Log the scrollOffset value when it changes
    useEffect(() => {
        console.log(scroll)
        console.log("Scroll Offset:", scrollOffset);
        // If you need more detailed information about the scroll
        console.log("Scroll Pages:", scroll.pages);
    }, [scrollOffset]);  // This will run every time scrollOffset changes

    useFrame(() => {
        const pages = 7;  // Total number of pages
        const smoothOffset = scroll.offset * pages;  // Scale scroll offset by number of pages
        // if (meshRef.current) {
        //     // Map scroll offset to rotation on Y-axis (smooth animation)
        //     // We use smoothOffset to ensure rotation continues fluidly within each page
        //     meshRef.current.rotation.y = smoothOffset * Math.PI * 2;
        // }
    
        meshesRef.current.forEach((meshRef, index) => {
            if (meshRef) {
                // Apply scroll offset to the position of each mesh
                const offsetFactor = smoothOffset - index; // Calculate position based on index and scroll offset
                meshRef.position.y = offsetFactor * 2; // Adjust the factor (2) to control spacing and scroll speed
            }
        });

        if (shadersRef.current) {
            // Map scroll offset directly to time (smooth, continuous animation)
            // We also use smoothOffset for the wave animation to ensure it's smooth per page
            const animate = smoothOffset * Math.PI * 8;  // This controls the wave's time
            shadersRef.current.uniforms.u_time.value = animate;
        }
    });
    
  
    const [curve] = useState(() => {
        // Create an empty array to stores the points
        let points = []
        // Define points along Z axis
        for (let i = 0; i < 50; i += 1)
        points.push(new THREE.Vector3(1 - Math.random() * 2, 1 - Math.random() * 2, 10 * (i / 4)))
        return new THREE.CatmullRomCurve3(points)
    })


    const textureL= useLoader(THREE.TextureLoader, "./img/me1.jpg");  // left image
    const textureR = useLoader(THREE.TextureLoader, "./img/me2.jpg");  // right image

    
    const data = useMemo(() => ({
        u_texture_l: { type: "t", value: textureL },
        u_texture_r: { type: "t", value: textureR },
        u_time: { type: "f", value: 0.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2(0.0, 0.0) },
    }), [textureL, textureR]);


    return (
        <>
            {/* <mesh ref={meshRef} position={[1.5,0,0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="skyblue" />
            </mesh> */}

            {Array.from({ length: numPages }).map((_, index) => (
                <mesh
                    key={index}
                    ref={(el) => meshesRef.current[index] = el} // Set the ref for each mesh
                    position={[0, index * 2, 0]} // Set initial positions with enough spacing
                    rotation={[0, 0, 0]} // No rotation needed here
                >
                    <planeGeometry args={[2, 1, 128, 128]} />
                    <shaderMaterial
                        transparent={true}
                        ref={shadersRef}
                        uniforms={data}
                        fragmentShader={fragmentShader}
                        vertexShader={vertexShader}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}


        </>
    )
}

const ScrollingShader = () => {
    return (
        <div className='mirror-comp' 
        // style={{ height: '200vh', overflowY: 'scroll' }}
        > 
            <Canvas
                className="three-canvas"
                shadows
                flat
                gl={{ antialias: true }}
                camera={{ position: [0, 0, 1] }}
            >
                <pointLight position={[10, 10, 10]} />
                <Suspense fallback={null}>
                    <ScrollControls damping={1} pages={14} >
                    {/* <Scroll> */}
                        <Scene />
                    {/* </Scroll> */}
                    </ScrollControls>
                    {/* <OrbitControls/> */}
                </Suspense>


            </Canvas>
        </div>
    )
}

export default ScrollingShader