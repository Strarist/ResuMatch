import Link from 'next/link'

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-gray-900/80 border-t border-gray-800 py-8 mt-16">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-4">
        <div className="text-gray-400 text-sm">© {new Date().getFullYear()} ResuMatch. All rights reserved.</div>
        <div className="flex gap-6 items-center">
          <Link href="/" className="hover:text-white text-gray-400 transition-colors">Home</Link>
          <a href="#features" className="hover:text-white text-gray-400 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white text-gray-400 transition-colors">How it Works</a>
          <a href="https://github.com/your-org/resumatch" target="_blank" rel="noopener noreferrer" className="hover:text-white text-gray-400 transition-colors font-semibold flex items-center gap-1">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.606-2.665-.304-5.466-1.334-5.466-5.931 0-1.31.468-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.004.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.625-5.475 5.921.43.372.813 1.104.813 2.226 0 1.606-.014 2.898-.014 3.293 0 .321.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
} 