import { useState } from 'react'

import './App.css'
import ShaderMotion from './ComplexDesign/ShaderMotion'
// import ShaderCircShape from './ComplexDesign/ShaderCircShape'
import ShaderShapes from './ComplexDesign/ShaderShapes'
import ImageShaderPopup from './ComplexDesign/ImageShaderPopup'
import ImageShader from './ComplexDesign/ImageShader'
import MirrorSelf from './ThreeDesign/MirrorSelf'
import SpotLights from './ThreeDesign/SpotLights'
import BoxStyle from './ThreeDesign/Boxes'
import BufferGeometries from './ThreeDesign/BufferGeometries'
import BufferGeometriesInterAction from './ThreeDesign/BufferGeometriesInterAction'
import BufferPlayAround1 from './ThreeDesign/BufferPlayAround1'
import BufferPlayAround2 from './ThreeDesign/BufferPlayAround2'
import ScrollingShader from './InterAction/ScrollingShader'
import ScrollingShader2 from './InterAction/ScrollShader2'
import UniverseOfBloomingTreesScene from './ComplexDesign/TreeScene'
import TreeLife from './ComplexDesign/TreeLife'
import TreeLifeShader from './ComplexDesign/TreeLifeShader'
import TransparentBox from './ComplexDesign/TransparentBox'
import TreeTrasparentBox from './ComplexDesign/TreeTransparentBox'
import ShaderRaycast from './ComplexDesign/ShaderRaycast'
// import AdvancedTreeScene from './ComplexDesign/TreeScene'
// import SampleShader from './ComplexDesign/SampleShader'
// import TextGLSL from './ComplexDesign/TextGLSL'
// import LoadingTransition from './ComplexDesign/LoadingTransition'
// import Music from './ComplexDesign/Music'

function App() {

  return (
    <>

      <div className='App'>
        {/* <ShaderMotion/> */}
        {/* <MirrorSelf/> */}
        {/* <SpotLights/> */}
        {/* <ScrollingShader/> */}
        {/* <ScrollingShader2/> */}
        {/* <UniverseOfBloomingTreesScene/> */}
        {/* <TreeLife/> */}
        {/* <TreeLifeShader/> */}
        {/* <TransparentBox/> */}
        {/* <TreeTrasparentBox/> */}

        <ShaderRaycast/>

        {/* <BufferGeometries/> */}
        {/* <BufferGeometriesInterAction/> */}
        {/* <BufferPlayAround1/> */}
        {/* <BufferPlayAround2/> */}
        {/* <BoxStyle/> */}
        {/* <ShaderCircShape/> */}
        {/* <ShaderShapes/> */}
        {/* <Music/> */}
        {/* <ImageShaderPopup/> */}
        {/* <ImageShader/> */}
        {/* <SampleShader/> */}
        {/* <TextGLSL/> */}
        {/* <LoadingTransition/> */}

      </div>
    </>
  )
}

export default App
