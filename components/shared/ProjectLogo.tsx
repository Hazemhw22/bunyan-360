'use client'

import Image from 'next/image'

export default function ProjectLogo() {
  return (
    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
      <Image 
        src="/logo.jpg" 
        alt="بنيان 360" 
        width={40} 
        height={40} 
        className="object-contain w-full h-full" 
      />
    </div>
  )
}

