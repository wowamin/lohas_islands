import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // 這裡通常是 ./App
import './index.css'
import './App.css'
import './city.css'
import '../public/senior-ui/senior-ui.css'

ReactDOM.createRoot(document.querySelector('.app-root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
