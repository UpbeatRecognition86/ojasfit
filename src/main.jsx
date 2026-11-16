import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StoreProvider } from './lib/store.jsx'
import { AccountProvider } from './lib/account.jsx'
import '@fontsource-variable/anek-devanagari/wght.css'
import './styles.css'
import { loadVoicePack, loadVideoPack, loadDemoPack } from './lib/media.js'

loadVoicePack()
loadVideoPack()
loadDemoPack()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <AccountProvider>
        <App />
      </AccountProvider>
    </StoreProvider>
  </StrictMode>
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
