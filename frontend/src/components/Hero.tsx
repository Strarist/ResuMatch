import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[60vh] py-16 w-full">
      {/* Animated SVG/AI Icon */}
      <div className="mb-8 animate-fade-in">
        <Image src="/logo.svg" alt="AI Resume Matcher" width={96} height={96} className="drop-shadow-xl animate-spin-slow" />
      </div>
      {/* Animated Heading */}
      <h1 className="text-5xl md:text-6xl font-extrabold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-slide-in-bottom font-[Poppins,Inter,sans-serif]">
        AI-Powered Resume Matcher
      </h1>
      <p className="mt-6 text-lg md:text-2xl text-center text-gray-200 max-w-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
        Instantly match your resume to the best jobs. Visualize your skills, track your progress, and land your dream role with ResuMatch.
      </p>
      {/* CTA Buttons */}
      <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <Link href="/upload" className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400">
          Upload Resume
        </Link>
        <Link href="/dashboard" className="px-8 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400">
          Go to Dashboard
        </Link>
      </div>
      {/* Optional SVG/Lottie background */}
      <svg className="absolute -z-10 left-1/2 top-0 -translate-x-1/2" width="900" height="300" viewBox="0 0 900 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="450" cy="150" rx="400" ry="80" fill="url(#paint0_radial)" fillOpacity="0.15" />
        <defs>
          <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(450 150) scale(400 80)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#a21caf" />
          </radialGradient>
        </defs>
      </svg>
    </section>
  );
} 