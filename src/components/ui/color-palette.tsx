"use client"

import { cn } from "@/lib/utils"

interface ColorSwatchProps {
  name: string
  color: string
  className?: string
}

function ColorSwatch({ name, color, className }: ColorSwatchProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="h-16 w-full rounded-lg border-2 border-border shadow-md"
        style={{ backgroundColor: color }}
      />
      <div className="text-center">
        <p className="text-xs font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{color}</p>
      </div>
    </div>
  )
}

export function ColorPalette() {
  const colors = [
    { name: "Primary", color: "hsl(var(--primary))" },
    { name: "Secondary", color: "hsl(var(--secondary))" },
    { name: "Accent", color: "hsl(var(--accent))" },
    { name: "Destructive", color: "hsl(var(--destructive))" },
    { name: "Muted", color: "hsl(var(--muted))" },
    { name: "Border", color: "hsl(var(--border))" },
    { name: "Input", color: "hsl(var(--input))" },
    { name: "Ring", color: "hsl(var(--ring))" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-card rounded-xl border-2 border-border shadow-lg">
      {colors.map((color) => (
        <ColorSwatch
          key={color.name}
          name={color.name}
          color={color.color}
        />
      ))}
    </div>
  )
}

export function ContrastChecker() {
  return (
    <div className="space-y-6 p-6 bg-card rounded-xl border-2 border-border shadow-lg">
      <h3 className="text-lg font-bold text-foreground">Contrast Examples</h3>
      
      <div className="grid gap-4">
        <div className="p-4 bg-primary text-primary-foreground rounded-lg">
          <p className="font-semibold">Primary Text on Primary Background</p>
          <p className="text-sm opacity-90">This should have excellent contrast</p>
        </div>
        
        <div className="p-4 bg-secondary text-secondary-foreground rounded-lg">
          <p className="font-semibold">Secondary Text on Secondary Background</p>
          <p className="text-sm opacity-90">This should have good contrast</p>
        </div>
        
        <div className="p-4 bg-muted text-muted-foreground rounded-lg">
          <p className="font-semibold">Muted Text on Muted Background</p>
          <p className="text-sm opacity-90">This should have readable contrast</p>
        </div>
        
        <div className="p-4 bg-destructive text-destructive-foreground rounded-lg">
          <p className="font-semibold">Destructive Text on Destructive Background</p>
          <p className="text-sm opacity-90">This should have high contrast for warnings</p>
        </div>
      </div>
    </div>
  )
}
