import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import ViewerMain from './ViewerMain'
// import {HeroUIProvider} from "@heroui/react";

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="App">
        {/* <HeroUIProvider> */}
            <ViewerMain />
        {/* </HeroUIProvider> */}
          {/* <img src={reactLogo} className="logo react" alt="React logo" />
          <img src={viteLogo} className="logo vite" alt="Vite logo" /> */}
        
      </div>
    </>
  )
}

export default App
