import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Bottom sheet. Rendered into <body> so it is always positioned against the visible
// screen, whatever the page underneath is doing, and the page behind cannot scroll.
export default function Sheet({ onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])
  return createPortal(
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body
  )
}
