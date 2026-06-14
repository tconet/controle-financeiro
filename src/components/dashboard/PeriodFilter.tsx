'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS } from '@/lib/utils'

interface PeriodFilterProps {
  month: number
  year: number
  onChange: (month: number, year: number) => void
}

export function PeriodFilter({ month, year, onChange }: PeriodFilterProps) {
  function prev() {
    if (month === 1) onChange(12, year - 1)
    else onChange(month - 1, year)
  }

  function next() {
    if (month === 12) onChange(1, year + 1)
    else onChange(month + 1, year)
  }

  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-2 py-1.5">
      <button
        onClick={prev}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[130px] text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <button
        onClick={next}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
