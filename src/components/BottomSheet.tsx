import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

interface BottomSheetProps {
  title: string
  children: ReactNode
  peekHeight?: number
}

export function BottomSheet({ title, children, peekHeight = 200 }: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const startY = useRef(0)
  const dragging = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    startY.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      dragging.current = false
      const delta = startY.current - e.clientY
      if (delta > 40) setExpanded(true)
      else if (delta < -40) setExpanded(false)
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    },
    [],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="absolute bottom-[72px] left-0 right-0 z-30 transition-[height] duration-300 ease-out"
      style={{ height: expanded ? '55%' : peekHeight }}
    >
      <div className="flex h-full flex-col rounded-t-3xl border border-b-0 border-guilder-border bg-guilder-bg shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:border-guilder-dark-border dark:bg-guilder-dark-bg">
        <div
          className="flex cursor-grab flex-col items-center pt-3 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onClick={() => setExpanded((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v)
          }}
        >
          <div className="mb-3 h-1 w-10 rounded-full bg-guilder-border dark:bg-guilder-dark-border" />
          <h2 className="w-full px-5 text-left text-base font-bold">{title}</h2>
        </div>
        <div className="flex-1 overflow-hidden px-5 pb-4">{children}</div>
      </div>
    </div>
  )
}
