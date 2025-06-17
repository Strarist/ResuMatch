import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  colors?: string[];
  className?: string;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
}

export const Confetti = ({
  isActive,
  duration = 3000,
  colors = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'],
  className,
}: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
      const newPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      setPieces(newPieces);

      // Clear confetti after duration
      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, colors]);

  return (
    <AnimatePresence>
      {isActive && (
        <div
          className={cn(
            'fixed inset-0 pointer-events-none overflow-hidden z-50',
            className
          )}
        >
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute w-2 h-2"
              style={{
                left: `${piece.x}%`,
                backgroundColor: piece.color,
                borderRadius: '50%',
              }}
              initial={{
                y: piece.y,
                x: piece.x,
                rotate: piece.rotation,
                scale: piece.scale,
                opacity: 1,
              }}
              animate={{
                y: '100vh',
                x: piece.x + (Math.random() - 0.5) * 100,
                rotate: piece.rotation + 360 * (Math.random() * 2 + 1),
                scale: piece.scale * 0.8,
                opacity: 0,
              }}
              transition={{
                duration: duration / 1000,
                ease: [0.32, 0.72, 0, 1],
                delay: Math.random() * 0.5,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Example usage:
// const [showConfetti, setShowConfetti] = useState(false);
// 
// <button onClick={() => setShowConfetti(true)}>
//   Celebrate!
// </button>
// 
// <Confetti
//   isActive={showConfetti}
//   duration={3000}
//   colors={['#0ea5e9', '#22c55e', '#f59e0b']}
// /> 