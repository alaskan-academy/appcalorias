import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 72 // px to pull before triggering reload
const MAX_PULL  = 96

export default function PullToRefresh() {
  const [pull, setPull]       = useState(0)
  const [ready, setReady]     = useState(false)
  const startY  = useRef(null)
  const pulling = useRef(false)

  useEffect(() => {
    function onTouchStart(e) {
      if (window.scrollY === 0 && e.touches.length === 1) {
        startY.current = e.touches[0].clientY
        pulling.current = true
      }
    }

    function onTouchMove(e) {
      if (!pulling.current || startY.current === null) return
      const dist = e.touches[0].clientY - startY.current
      if (dist <= 0) { pulling.current = false; setPull(0); return }
      e.preventDefault() // prevent native scroll bounce
      const clamped = Math.min(dist * 0.5, MAX_PULL)
      setPull(clamped)
      setReady(clamped >= THRESHOLD)
    }

    function onTouchEnd() {
      if (!pulling.current) return
      pulling.current = false
      startY.current = null
      if (pull >= THRESHOLD) {
        window.location.reload()
      } else {
        setPull(0)
        setReady(false)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: false })
    document.addEventListener('touchend',   onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove',  onTouchMove)
      document.removeEventListener('touchend',   onTouchEnd)
    }
  }, [pull])

  if (pull === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-end justify-center pointer-events-none md:hidden"
      style={{ height: pull }}
    >
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-medium transition-colors ${ready ? 'text-violet-400' : 'text-zinc-500'}`}>
        <RefreshCw size={13} className={ready ? 'animate-spin' : ''} style={{ transform: `rotate(${(pull / MAX_PULL) * 360}deg)` }} />
        {ready ? 'Solte para atualizar' : 'Puxe para atualizar'}
      </div>
    </div>
  )
}
