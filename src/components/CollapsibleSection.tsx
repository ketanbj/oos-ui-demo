import { useState, type ReactNode } from 'react'

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-glow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-white/10 px-3 py-1 text-sm font-semibold text-space-accent hover:border-space-accent"
        >
          {open ? 'Show less' : 'Show more'}
        </button>
      </div>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </section>
  )
}
