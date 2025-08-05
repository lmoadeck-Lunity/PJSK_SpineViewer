import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import ViewerMain from './ViewerMain'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="App">
        <ViewerMain />
      </div>
    </>
  )
}

export default App
