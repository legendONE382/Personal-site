import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './ui/App'

createRoot(document.getElementById('root')!).render(<App />)

/* Offline + instant repeat visits. Registered after load so it never competes
   with the first paint, and only in production over http(s) (not file://). */
if ('serviceWorker' in navigator && import.meta.env.PROD && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* a failed registration is harmless */
    })
  })
}
