import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

// Matches Radix UI's default toast duration
const DEFAULT_TOAST_DURATION = 5000

// --- Hover/focus-aware dismiss timer ---

interface DismissTimer {
  timeoutId: ReturnType<typeof setTimeout>
  startedAt: number
  remaining: number
}

const dismissTimers = new Map<string, DismissTimer>()

function startDismissTimer(toastId: string, duration: number) {
  clearDismissTimer(toastId)
  const timeoutId = setTimeout(() => {
    dismissTimers.delete(toastId)
    dispatch({ type: "DISMISS_TOAST", toastId })
  }, duration)
  dismissTimers.set(toastId, { timeoutId, startedAt: Date.now(), remaining: duration })
}

function clearDismissTimer(toastId: string) {
  const timer = dismissTimers.get(toastId)
  if (timer) {
    clearTimeout(timer.timeoutId)
    dismissTimers.delete(toastId)
  }
}

export function pauseToast(toastId: string) {
  const timer = dismissTimers.get(toastId)
  if (!timer) return
  clearTimeout(timer.timeoutId)
  const elapsed = Date.now() - timer.startedAt
  const remaining = Math.max(0, timer.remaining - elapsed)
  dismissTimers.set(toastId, { timeoutId: -1 as unknown as ReturnType<typeof setTimeout>, startedAt: timer.startedAt, remaining })
}

export function resumeToast(toastId: string) {
  const timer = dismissTimers.get(toastId)
  if (!timer) return
  const timeoutId = setTimeout(() => {
    dismissTimers.delete(toastId)
    dispatch({ type: "DISMISS_TOAST", toastId })
  }, timer.remaining)
  dismissTimers.set(toastId, { timeoutId, startedAt: Date.now(), remaining: timer.remaining })
}

// --- End hover/focus-aware dismiss timer ---

type Toast = Omit<ToasterToast, "id">

function toast({ duration, ...props }: Toast & { duration?: number }) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      duration: Infinity,
      onOpenChange: (open) => {
        if (!open) {
          clearDismissTimer(id)
          dismiss()
        }
      },
    },
  })

  startDismissTimer(id, duration != null && isFinite(duration) ? duration : DEFAULT_TOAST_DURATION)

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
