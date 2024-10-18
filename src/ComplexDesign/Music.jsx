import React, { useEffect, useRef, useState } from 'react'
import './musics.scss'


const Music = () => {

    const audioRef=  useRef()
    const refPlay = useRef()
    const refPause = useRef()
    const [play,setPlay] = useState(false)
    const audioCtx = useRef(null)
    const canvasRef = useRef(null)
    const animationIds = useRef([]);


    useEffect(() => {
        const plays = refPlay.current;
        const pauses = refPause.current;
        let audio1 = audioRef.current;
        let analyser = null;
        const canvas = canvasRef.current;
        
        let audioSource = null;
        audio1.volume = 0.3
        audio1.crossOrigin = "anonymous";
        
        pauses.addEventListener("click",() => {
            setPlay(false)
            audio1.pause()
            cancelAnimationFrame(animationIds.current[0]);
            cancelAnimationFrame(animationIds.current[1]);
        })
        
        plays.addEventListener("click", function () {
            
            setPlay(true)
            audio1.play();
            
            if (!audioCtx.current) {
                audioCtx.current = new AudioContext(); 
            }
            
            audioSource = audioSource || audioCtx.current.createMediaElementSource(audio1);
            
            if (audioSource.mediaElement !== audio1) {
                audioSource.disconnect();
                audioSource = audioCtx.current.createMediaElementSource(audio1);
            }
            
            analyser = audioCtx.current.createAnalyser();
            audioSource.connect(analyser);
            analyser.connect(audioCtx.current.destination);
            analyser.fftSize = 256;
            let bufferLength = analyser.frequencyBinCount;
            let dataArray = new Uint8Array(bufferLength);

            console.log(bufferLength)
            console.log(dataArray)

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext("2d");
            const barWidth = canvas.width / 2 / bufferLength;
            let x = 0;
            
            function animate() {
                x = 0;
                ctx.clearRect(0, 0, canvas.width, canvas.height); 
                analyser.getByteFrequencyData(dataArray); 
                drawVisualizer({ bufferLength, dataArray, barWidth });
                animationIds.current[0] = requestAnimationFrame(animate); 
            }

            const drawVisualizer = ({ bufferLength, dataArray, barWidth }) => {
                let barHeight;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i]; 
                    ctx.fillStyle = `rgb(${ dataArray[i] / 1 },${ dataArray[i] }, ${ Math.sqrt(dataArray[i] * 2) } )`;
                    ctx.fillRect(
                        canvas.width / 2 - x * 2, 
                        canvas.height - barHeight * 2.5 ,
                        barWidth * 2  ,
                        barHeight * 2.5
                    );
                    x += barWidth; 
                }

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i]; 
                    ctx.fillStyle = `rgb(${dataArray[i]},177, ${ Math.sqrt( i * i * i  ) })`;
                    ctx.fillRect(x , (canvas.height)  - barHeight * 2.5   , barWidth * 2, barHeight * 4.5  );
                    x += barWidth * 2; 
                }

            };
            drawVisualizer({ bufferLength, dataArray, barWidth });
            animationIds.current[0] = requestAnimationFrame(animate); 
        });

        return () => {
            cancelAnimationFrame(animationIds.current[0]);
        };

    },[])

    return (
        <div className='music-comp'>
            <div className="music-show">
                <img src="./img/ase3.jpg" alt="" />
                <div className="pre-audio">
                    <canvas id="canvas2" ref={canvasRef}></canvas>
                </div>
                <div className="pre-text">
                    
                </div>
                <audio 
                    id="audio" 
                    src={'./music/Isekai.mp3'} 
                    style={{display:'none'}}
                    ref={audioRef}
                ></audio>
            </div>
            <div className="music-sframe">
                <img src="./img/ase3.jpg" alt="" />
                <div className="play-button">
                    <div className="press">
                        <svg 
                            width="18" 
                            height="21" 
                            viewBox="0 0 18 21" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            ref={refPlay}
                            style={ play ? { display:'none' } : {display:"flex"}}
                        >
                        <path d="M16.4922 9.5136L2.42189 0.909108C2.24412 0.798828 2.0399 0.738536 1.83074 0.734583C1.62158 0.73063 1.41523 0.783163 1.23342 0.886647C1.05293 0.985836 0.902578 1.13193 0.798241 1.30949C0.693904 1.48705 0.639455 1.68949 0.640644 1.89544V19.1044C0.639455 19.3104 0.693904 19.5128 0.798241 19.6904C0.902578 19.8679 1.05293 20.014 1.23342 20.1132C1.41523 20.2167 1.62158 20.2692 1.83074 20.2653C2.0399 20.2613 2.24412 20.201 2.42189 20.0907L16.4922 11.4863C16.6616 11.3833 16.8015 11.2385 16.8987 11.0657C16.9958 10.893 17.0469 10.6981 17.0469 10.4999C17.0469 10.3017 16.9958 10.1069 16.8987 9.93413C16.8015 9.76138 16.6616 9.61656 16.4922 9.5136ZM16.084 10.8193L2.01369 19.4247C1.95412 19.4613 1.88581 19.4813 1.81589 19.4825C1.74598 19.4837 1.67703 19.4661 1.61623 19.4316C1.55693 19.4 1.50739 19.3529 1.47296 19.2952C1.43854 19.2376 1.42054 19.1716 1.42092 19.1044V1.89544C1.42054 1.82828 1.43854 1.7623 1.47296 1.70463C1.50739 1.64697 1.55693 1.59982 1.61623 1.56829C1.67703 1.53375 1.74598 1.51616 1.81589 1.51737C1.88581 1.51857 1.95412 1.53852 2.01369 1.57512L16.084 10.1806C16.1395 10.2134 16.1854 10.2601 16.2173 10.3161C16.2493 10.3721 16.2661 10.4355 16.2661 10.4999C16.2661 10.5644 16.2493 10.6277 16.2173 10.6837C16.1854 10.7397 16.1395 10.7864 16.084 10.8193Z" fill="#e53a5f"/>
                        </svg>
                        <svg 
                            className='music-pause' 
                            width="10" height="12" 
                            viewBox="0 0 10 12" fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                            ref={refPause}
                            style={ play ? { display:'flex' } : {display:"none"}}
                        >
                            <path d="M8 1C8 0.734784 8.10536 0.48043 8.29289 0.292893C8.48043 0.105357 8.73478 0 9 0C9.26522 0 9.51957 0.105357 9.70711 0.292893C9.89464 0.48043 10 0.734784 10 1V11C10 11.2652 9.89464 11.5196 9.70711 11.7071C9.51957 11.8946 9.26522 12 9 12C8.73478 12 8.48043 11.8946 8.29289 11.7071C8.10536 11.5196 8 11.2652 8 11V1ZM0 1C0 0.734784 0.105357 0.48043 0.292893 0.292893C0.48043 0.105357 0.734784 0 1 0C1.26522 0 1.51957 0.105357 1.70711 0.292893C1.89464 0.48043 2 0.734784 2 1V11C2 11.2652 1.89464 11.5196 1.70711 11.7071C1.51957 11.8946 1.26522 12 1 12C0.734784 12 0.48043 11.8946 0.292893 11.7071C0.105357 11.5196 0 11.2652 0 11V1Z" fill="#e53a5f"/>
                        </svg>
                    </div>
                    <div className="bg1 ll1"></div>
                    <div className="bg2 ll1"></div>
                    <div className="bg3 ll1"></div>
                </div>
            </div>
        </div>
    )


}

export default Music