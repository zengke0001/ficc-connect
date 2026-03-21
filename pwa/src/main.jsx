import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { registerSW } from 'virtual:pwa-register'
import './styles/index.css'

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New version available. Reload to update?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
