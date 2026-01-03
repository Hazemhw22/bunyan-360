'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'

interface BuildingCardProps {
  id: string
  buildingCode: string
  totalProgress: number
  projectId: string
}

export default function BuildingCard({ id, buildingCode, totalProgress, projectId }: BuildingCardProps) {
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (totalProgress / 100) * circumference

  return (
    <Link
      href={`/buildings/${id}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="text-blue-600 dark:text-blue-400" size={32} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {buildingCode === 'الرئيسية' ? 'البناية الرئيسية' : `البناية ${buildingCode}`}
          </h3>
        </div>
        <div className="relative w-24 h-24">
          <svg className="transform -rotate-90 w-24 h-24">
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="text-blue-600 dark:text-blue-400 transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalProgress.toFixed(0)}%</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-400 mt-2">انقر لعرض BOQ وتحديث الإنجاز</p>
    </Link>
  )
}

