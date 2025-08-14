import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
<<<<<<< HEAD:src/App.tsx
import ViewerMain from './ViewerMain'
// import {HeroUIProvider} from "@heroui/react";
=======
import LazyViewerMain from './components/LazyViewerMain'
>>>>>>> parent of efefc9b (fghjd):src/App.jsx

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="App">
<<<<<<< HEAD:src/App.tsx
        {/* <HeroUIProvider> */}
            <ViewerMain />
        {/* </HeroUIProvider> */}
          {/* <img src={reactLogo} className="logo react" alt="React logo" />
          <img src={viteLogo} className="logo vite" alt="Vite logo" /> */}
        
=======
        <LazyViewerMain />
>>>>>>> parent of efefc9b (fghjd):src/App.jsx
      </div>
    </>
  )
}

export default App
