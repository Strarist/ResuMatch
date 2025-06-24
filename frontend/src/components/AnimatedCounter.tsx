'use client'

import { useState } from 'react'
import CountUp from 'react-countup'
import { useInView } from 'react-intersection-observer'

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export default function AnimatedCounter({ 
  end, 
  duration = 2, 
  prefix = '', 
  suffix = '', 
  className = '' 
}: AnimatedCounterProps) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    onChange: (inView) => {
      if (inView) {
        setHasAnimated(true)
      }
    },
  })

  return (
    <div ref={ref} className={className}>
      {inView || hasAnimated ? (
        <CountUp end={end} duration={duration} prefix={prefix} suffix={suffix} />
      ) : (
        <span>{prefix}0{suffix}</span>
      )}
    </div>
  )
} 