export default function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`
        relative isolate overflow-hidden rounded-xl bg-gray-900/50 
        before:absolute before:inset-0 
        before:-translate-x-full before:animate-[shimmer_2s_infinite] 
        before:bg-gradient-to-r 
        before:from-transparent before:via-white/10 before:to-transparent
        ${className}
      `}
    >
      <div className="h-full w-full bg-gradient-to-br from-gray-800 to-gray-900/50" />
    </div>
  )
}

// Add the shimmer animation to globals.css 