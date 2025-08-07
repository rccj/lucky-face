"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#111827",
          "--normal-border": "#e5e7eb",
          "--description-text": "#374151",
          zIndex: 9999,
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          zIndex: 9999,
          backgroundColor: "#ffffff",
          color: "#111827",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          fontSize: "16px",
          fontWeight: "500",
        },
        className: "sonner-toast",
        ...props.toastOptions,
      }}
      {...props}
    />
  )
}

export { Toaster }
