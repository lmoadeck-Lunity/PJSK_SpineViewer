import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import LazyViewerMain from './components/LazyViewerMain'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="App">
        <LazyViewerMain />
      </div>
    </>
  )
}

export default App
