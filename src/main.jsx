import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StoreProvider } from './lib/store.jsx'
import '@fontsource-variable/anek-devanagari/wght.css'
import './styles.css'
import { loadVoicePack, loadVideoPack } from './lib/media.js'

loadVoicePack()
loadVideoPack()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
