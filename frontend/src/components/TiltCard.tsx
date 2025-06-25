'use client'

import React, { useRef, MouseEvent } from 'react'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const x = e.clientX - left
    const y = e.clientY - top

    const rotateX = (y / height - 0.5) * -20 // Max rotation 10deg
    const rotateY = (x / width - 0.5) * 20   // Max rotation 10deg

    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`
  }

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)'
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transform-style-3d transition-transform duration-500 ease-out ${className}`}
    >
      {children}
    </div>
  )
}

export default TiltCard 