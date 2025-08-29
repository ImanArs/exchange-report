import { createPortal } from 'react-dom'
import React from 'react'
import { Button } from './button'

type ModalProps = {
  open: boolean
  title?: string
  children?: React.ReactNode
  onClose: () => void
  footer?: React.ReactNode
}

export function Modal({ open, title, children, onClose, footer }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[16px] border border-[#BEBEBE]/30 bg-[#434377]/95 p-4 text-white shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-[#6161D6]">
            <span className="sr-only">Close</span>
            ×
          </Button>
        </div>
        <div className="space-y-3">{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

