'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Panel {
  prompt: string;
  caption: string;
  imageUrl?: string;
}

export default function PromptForm() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [panels, setPanels] = useState<Panel[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  // Poll for all predictions
  useEffect(() => {
    if (!predictions.length) return;

    const pollPredictions = async () => {
      try {
        const updatedPredictions = await Promise.all(
          predictions.map(async (pred, index) => {
            const response = await fetch(`/api/replicate/status?id=${pred.id}`);
            const data = await response.json();
            
            if (data.status === 'succeeded' && data.output?.[0]) {
              setPanels(currentPanels => 
                currentPanels.map((panel, i) => 
                  i === index ? { ...panel, imageUrl: data.output[0] } : panel
                )
              );
            }
            return data;
          })
        );

        // Check if all predictions are complete
        const allComplete = updatedPredictions.every(
          pred => ['succeeded', 'failed', 'canceled'].includes(pred.status)
        );

        if (!allComplete) {
          setTimeout(pollPredictions, 1000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setError('Error checking generation status');
        setLoading(false);
      }
    };

    pollPredictions();
  }, [predictions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPanels([]);
    setPredictions([]);

    try {
      const response = await fetch('/api/comics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setPanels(data.story.comics);
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to generate comic');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-lg font-medium text-purple-300 mb-3">
              What adventure should Yuri go on?
            </label>
            <textarea
              id="prompt"
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg shadow-inner focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
              placeholder="Example: Yuri discovers a mysterious portal in the garden..."
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-4 px-6 rounded-lg text-lg font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
          >
            {loading ? 'Creating Comic...' : 'Generate Adventure'}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="text-center p-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-white"></div>
          <p className="mt-4 text-xl text-purple-300">Creating your comic adventure...</p>
        </div>
      )}
      
      {panels.length > 0 && (
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8">
            Yuri's Adventure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {panels.map((panel, index) => (
              <div key={index} className="space-y-4">
                {panel.imageUrl && (
                  <div className="relative aspect-square rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
                    <Image
                      src={panel.imageUrl}
                      alt={`Comic panel ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="bg-gray-700 p-4 rounded-lg shadow-inner">
                  <p className="text-gray-100 text-center font-medium">
                    {panel.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 