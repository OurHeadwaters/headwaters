import { useState, useEffect, useRef, type ReactNode, type ReactElement } from "react"
import { useToast } from "@/hooks/use-toast"
import { pauseToast, resumeToast, getToastProgress } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

interface ToastItemProps {
  id: string
  title?: ReactNode
  description?: ReactNode
  action?: ReactElement
  [key: string]: unknown
}

function ToastItem({ id, title, description, action, ...props }: ToastItemProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [progress, setProgress] = useState(100)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    function tick() {
      const info = getToastProgress(id)
      if (!info) {
        setProgress(0)
        return
      }
      const pct = info.total > 0 ? (info.remaining / info.total) * 100 : 0
      setProgress(Math.max(0, Math.min(100, pct)))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [id])

  function handleMouseEnter() {
    if (!hovered) {
      setHovered(true)
      pauseToast(id)
    }
  }

  function handleMouseLeave() {
    setHovered(false)
    if (!focused) {
      resumeToast(id)
    }
  }

  function handleFocus() {
    if (!focused) {
      setFocused(true)
      pauseToast(id)
    }
  }

  function handleBlur() {
    setFocused(false)
    if (!hovered) {
      resumeToast(id)
    }
  }

  return (
    <Toast
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
      <div
        className="absolute bottom-0 left-0 h-1 bg-foreground/20 w-full"
        aria-hidden="true"
      >
        <div
          className="h-full bg-foreground/50 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Toast>
  )
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <ToastItem
            key={id}
            id={id}
            title={title}
            description={description}
            action={action}
            {...props}
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
