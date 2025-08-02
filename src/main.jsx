import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import ViewerMain from './ViewerMain.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    {/* <ViewerMain ref={null} /> */}
  </StrictMode>,
)
