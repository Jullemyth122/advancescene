import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './loadingtransit.scss';
import gsap from 'gsap';
import { Flip } from 'gsap/all';
const LoadingTransition = () => {

    const [animDone,setAnimDone] = useState(false)
    const [loading, setLoading] = useState(0)
    const swapRef = useRef(null)
    const animRef = useRef(null)
    const ctx = useRef(gsap.context(() => {}))

    
    const formatLoading = (value) => {
        const hundreds = Math.floor(value / 100);
        const tens = Math.floor((value % 100) / 10);
        const ones = value % 10;
        return `${hundreds} / ${tens} / ${ones}`;
    };
      
    useLayoutEffect(() => {
        gsap.registerPlugin(Flip);
    },[])

    useEffect(() => {

        ctx.current.add("load",() => {
            const tl = gsap.timeline({ onComplete:() => {
                swapRef.current = Flip.getState(animRef.current, { props: "width, height" })
            } });

        
            tl.to(".loading-main h3",{ 
                opacity:1,
                duration:1.5,
                ease:"power4.inOut",
            },0)

            tl.to('.linex-r-x',{
                width:"20vw",
                right:"5%",
                duration:1.5,
                opacity:1,
                ease:'expo.inOut', 
            },0)
            .to('.linex-l-x',{
                width:"20vw",
                left:"5%",
                duration:1.5,
                opacity:1,
                ease:'expo.inOut'    
            },0)
            .to('.liney-tp-pg',{
                height:"20vh",
                top:"5%",
                duration:1.5,
                opacity:1,
                stagger:0.15,
                ease:'expo.inOut'    
            },0)
            .to('.liney-bt-pg',{
                height:"20vh",
                bottom:"5%",
                stagger:0.15,
                duration:1.5,
                opacity:1,
                ease:'expo.inOut'    
            },0)

            tl.to({}, {
                duration:10,
                onUpdate:() => {
                    setLoading(Math.floor(tl.progress() * 100))
                }}
            )

            
        })        

        ctx.current.load()
        
    },[])


    useLayoutEffect(() => {

        if (loading != 100 ) return;
        console.log(loading)
        Flip.from(swapRef.current,{
            duration:2,
            ease:"circ.inOut",
            position: true,
            absolute:true,
            width:true,
            onStart:() => { gsap.to('.loading-main',{ opacity:0, duration:2, delay:0.5, ease:"power4.inOut"}) },
            targets:[ animRef.current ]
        })
        const newTL = gsap.timeline()
        newTL.to('.linex-r-x',{
            width:"0vw",
            right:"35%",
            duration:1.5,
            opacity:0,
            ease:'expo.inOut'    
        },0)
        .to('.linex-l-x',{
            width:"0vw",
            left:"35%",
            duration:1.5,
            opacity:0,
            ease:'expo.inOut'    
        },0)
        .to('.liney-tp-pg',{
            height:"0vh",
            top:"35%",
            duration:1.5,
            opacity:0,
            stagger:0.15,
            ease:'expo.inOut'    
        },0)
        .to('.liney-bt-pg',{
            height:"0vh",
            bottom:"35%",
            stagger:0.15,
            duration:1.5,
            opacity:0,
            ease:'expo.inOut'    
        },0)
    },[loading])

    const formattedLoading = formatLoading(loading);


    return (
        <div className='loading-comp'> 
            {
                loading != 100 && 
                <div className="loading-main" data-flip-id="flip1" ref={animRef}>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-bt-pg"></div>
                    <div className="liney-bt-pg"></div>
                    <div className="liney-bt-pg"></div>
                    <div className="liney-bt-pg"></div>
                    

                    <div className="linex-r-x"></div>
                    <div className="linex-l-x"></div>


                    <h3>  
                        {formattedLoading}
                     </h3>


                </div>
            }

            <div className="loading-twap">
                 { loading == 100 &&
                    <div className="loading-main" data-flip-id="flip1" ref={animRef}>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-tp-pg"></div>
                    <div className="liney-bt-pg"></div>
                    <div className="liney-bt-pg"></div>
                    <div className="liney-bt-pg"></div>
                    <div className="liney-bt-pg"></div>
                    

                    <div className="linex-r-x"></div>
                    <div className="linex-l-x"></div>

                        <h3>                         
                            {formattedLoading}
                        </h3>
                    </div>
                 }
            </div>
        </div>
    )
}

export default LoadingTransition