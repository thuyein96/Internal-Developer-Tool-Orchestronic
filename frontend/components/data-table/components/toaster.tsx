"use client"

import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`min-w-[240px] rounded-md border bg-background px-4 py-3 shadow-lg ${
            t.variant === "destructive"
              ? "border-red-500 text-red-600"
              : "border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {t.title && (
                <p className="text-sm font-semibold leading-none">{t.title}</p>
              )}
              {t.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs text-muted-foreground hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
