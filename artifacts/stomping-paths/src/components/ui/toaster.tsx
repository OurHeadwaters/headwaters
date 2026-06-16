import { useState, type ReactNode, type ReactElement } from "react"
import { useToast } from "@/hooks/use-toast"
import { pauseToast, resumeToast } from "@/hooks/use-toast"
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
