import PromptForm from './components/PromptForm';
import { Fredoka } from 'next/font/google';
import type { Metadata } from 'next';

const fredoka = Fredoka({ subsets: ['latin'] });

// Add metadata for better SEO
export const metadata: Metadata = {
  title: 'AI Comic Generator - Yuri\'s Adventures',
  description: 'Generate comic adventures featuring Yuri the cat using AI',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-16">
          <h1 className={`${fredoka.className} text-6xl md:text-7xl font-extrabold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text animate-gradient tracking-tight`}>
            AI Comic Generator
          </h1>
          <p className={`${fredoka.className} text-2xl text-purple-300 font-light`}>
            Take Yuri on a New Adventure
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            <PromptForm />
          </div>
        </div>

        <footer className="mt-16 text-sm text-gray-400">
          Powered by AI • Featuring Yuri the Cat
        </footer>
      </div>
    </div>
  );
}
