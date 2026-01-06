'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'end'
}

export default function DropdownMenu({ trigger, children, align = 'end' }: DropdownMenuProps) {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, right: 0, left: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  
  // Check if current language is RTL
  const isRTL = i18n.language === 'ar' || i18n.language === 'he'
  
  // In RTL: 'end' means left, 'start' means right
  // In LTR: 'end' means right, 'start' means left
  // So if align='end', we want right in LTR and left in RTL
  const actualAlign = isRTL ? (align === 'end' ? 'start' : 'end') : align

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calculate position when opening
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right + window.scrollX,
          left: rect.left + window.scrollX,
        })
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, actualAlign])

  const dropdownContent = isOpen && typeof window !== 'undefined' ? (
    createPortal(
      <div
        ref={dropdownRef}
        className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[9999]"
        style={{
          top: `${position.top}px`,
          [actualAlign === 'end' ? 'right' : 'left']: `${actualAlign === 'end' ? position.right : position.left}px`,
        }}
      >
        {children}
      </div>,
      document.body
    )
  ) : null

  return (
    <div className="relative">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {dropdownContent}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function DropdownMenuItem({ children, onClick, className = '' }: DropdownMenuItemProps) {
  return (
    <div
      onClick={() => {
        onClick?.()
      }}
      className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer first:rounded-t-lg last:rounded-b-lg ${className}`}
    >
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
}

