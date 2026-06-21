import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Skillyn Career Operating System',
    short_name: 'Skillyn',
    description: 'AI-powered career growth platform that transforms resumes into personalized roadmaps, opportunities, market insights, and career coaching.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
