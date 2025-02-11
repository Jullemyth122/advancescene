import React,{ Suspense, useState } from 'react'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { Canvas, useFrame,useThree,extend, useLoader } from '@react-three/fiber'
import { useRef } from 'react'
import { useEffect } from 'react'
import { SpotLight } from 'three'
import gsap from 'gsap'
import { forwardRef } from 'react';
import * as THREE from 'three';
import { Sky } from '@react-three/drei';
import './boxes.css'
extend({ OrbitControls,PointerLockControls });

function City(props) {

    return (
        <object3D>
            <mesh
            // ref={ref}
            {...props}
            scale={[100,100,0.1]}
            rotation = {[Math.PI/2,0,0]}
            >
                <boxGeometry></boxGeometry>
                <meshStandardMaterial 
                    color={"#232323"} 
                    roughness="0.5" 
                    metalness="0.3" 
                    emissive={"#000000"} 
                ></meshStandardMaterial>
            </mesh>
            {Array.from({length:9},(_,i) => {
                return (Array.from({length:9},(_,ix) => {
                    if (i > 1 && i < 7 && ix > 1 && ix <7) {

                    } else {
                        return (
                            <City2 
                                key={ix}
                                delay={i + ix} 
                                position={[(i - 4)*10,props.position[1] + 0.5,(ix - 4)*10]}
                            ></City2>
                        )
                    }
                }))
            })}
        </object3D>
    )
}

function City2({ position, delay, lookAt }) {
    const ref = useRef();
    const textureLight = useLoader(THREE.TextureLoader, "./img/m1.jpg");

    useEffect(() => {
        function gsapIncrease(args, x, y, z) {
            gsap.fromTo(args, {
                y: 1
            }, {
                y: y,
                delay: delay / (Math.sqrt(delay)),
                duration: 2,
                ease: "ease.inOut"
            });
        }
        gsapIncrease(ref.current.scale, 0, 10, 0);
        gsapIncrease(ref.current.position, 0, 5, 0);
        ref.current.lookAt(0, 0, 0);
    }, []);

    return (
        <mesh
            position={[position[0], 0, position[2]]}
            scale={[4, 5, 2]}
            ref={ref}
        >
            <boxGeometry />
            <meshStandardMaterial
                color={"#ffffff"} // White color for debugging
                roughness={0.5}
                metalness={0.3}
                emissive={"#000000"}
                map={textureLight} // Texture applied here
            />
        </mesh>
    );
}


const Scene = forwardRef((props,ref) => {

    let moveForward = useRef(false);
    let moveBackward = useRef(false);
    let moveLeft = useRef(false);
    let moveRight = useRef(false);
    let canJump = useRef(false);

    let prevTime = performance.now();
    let velocity = useRef(new THREE.Vector3());
    let direction = useRef(new THREE.Vector3());

    const {refBlock,refInstruct,pointerRef} = ref

    const objects = [];

    const {
        camera, gl:{domElement},
        
    } = useThree()

    useEffect(() => {
        camera.position.set(0,5,0)
        
        // const controls = new PointerLockControls(camera,document.querySelector('#three-canvas-container'))
        
        pointerRef.current.addEventListener( 'unlock', function () {
            refBlock.current.style.display = 'block';
            refInstruct.current.style.display = '';
        } );
        
    },[])

    const onKeyDown = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward.current = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft.current = true;
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                moveBackward.current = true;
                break;

            case 'ArrowRight':
                case 'KeyD':
                moveRight.current = true;
                break;
                
                case 'Space':
                if ( canJump.current === true ) {
                    // velocity.y += 350;
                }
                canJump.current = false;
                break;

            }
            
        };

        const onKeyUp = function ( event ) {
            
            switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward.current = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft.current = false;
                break;
                
                case 'ArrowDown':
                    case 'KeyS':
                        moveBackward.current = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight.current = false;
                break;
                
            }

    };

    document.addEventListener( 'keydown', onKeyDown );
    document.addEventListener( 'keyup', onKeyUp );

    useFrame(() => {
        const time = performance.now()
        
        
        if (pointerRef.current.isLocked == true) {

            const delta = ( time - prevTime ) / 1000;

            velocity.current.x -= velocity.current.x * 10.0 * delta;
            velocity.current.z -= velocity.current.z * 10.0 * delta;

            velocity.current.y -= 9.8 * 100.0 * delta;
            
            direction.current.z = Number( moveForward.current ) - Number( moveBackward.current );
            direction.current.x = Number( moveRight.current ) - Number( moveLeft.current );
            direction.current.normalize(); // this ensures consistent movements in all directions
    
    
            if ( moveForward.current || moveBackward.current ) velocity.current.z -= direction.current.z * 400.0 * delta;
            if ( moveLeft.current || moveRight.current ) velocity.current.x -= direction.current.x * 400.0 * delta;

            pointerRef.current.moveRight(- velocity.current.x * delta)
            pointerRef.current.moveForward(- velocity.current.z * delta)

            // pointerRef.current.getObject().position.y += ( velocity.current.y * delta ); // new behavior

            if ( pointerRef.current.getObject().position.y < 10 ) {

                velocity.current.y = 0;
                pointerRef.current.getObject().position.y = 1;

                canJump.current = true;

            }
        }

        prevTime = time;

    })

    return (
        <>
            <ambientLight lookAt={[0,0,0]} intensity="5" color={0xffffff}/>
            {/* <pointLight position={[10,10,10]} lookAt={[0,0,0]}/> */}
            <spotLight position={[0,50,0]} scale={[10,10,10]} ></spotLight>
            <City position={[0,0,0]}/>
            {/* <Sky
                distance={45000} 
                sunPosition={[10, 5, 20]} 
                inclination={50} 
                azimuth={0.25}
                mieCoefficient={0.2}
                rayleigh={1}
                mieDirectionalG={1}
                turbidity={1}    
            /> */}
            <pointerLockControls ref={pointerRef} args={[camera,document.querySelector('#three-canvas-container')]} />
            {/* <orbitControls args={[camera,domElement]}/> */}
        </>
    )
})

const BoxStyle = () => {
    const refBlock = useRef(null)
    const refInstruct = useRef(null)
    const pointerRef = useRef(null)

    const handleClick = () => {
        pointerRef.current.lock()
        pointerRef.current.addEventListener("lock", () => {
            refInstruct.current.style.display = 'none';
            refBlock.current.style.display = 'none';
        })
    }

    return (
        <div className='box'>
            <div id="blocker" ref={refBlock} onClick={e => handleClick()}>
                <div id="instructions" ref={refInstruct}>
                    <p style={{fontSize:"36px"}}>
                        Click to play
                    </p>
                    <p>
                        Move: WASD<br/>
                        Jump: SPACE<br/>
                        Look: MOUSE
                    </p>
                </div>
            </div>
            <Canvas id="three-canvas-container">
                <Scene ref={{refBlock,refInstruct,pointerRef}}></Scene>
            </Canvas>
        </div>
    )
}

export default BoxStyle