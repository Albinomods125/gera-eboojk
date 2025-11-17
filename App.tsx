
import React, { useState, useCallback, FC } from 'react';
import { generateContentStructure, generateImageForText } from './services/geminiService';
import { createPdf } from './services/pdfService';
import type { GeneratedContent, AppState, Status } from './types';
import { SparklesIcon, DocumentIcon, DownloadIcon, ErrorIcon, BrandIcon } from './components/icons';

const App: FC = () => {
  const [state, setState] = useState<AppState>({
    status: 'idle',
    prompt: '',
    generatedContent: null,
    error: null,
    progress: '',
  });

  const handleGenerate = useCallback(async () => {
    if (!state.prompt.trim()) {
      setState(s => ({ ...s, status: 'error', error: 'Prompt cannot be empty.' }));
      return;
    }

    setState(s => ({ ...s, status: 'loading', generatedContent: null, error: null, progress: 'Warming up the AI...' }));

    try {
      setState(s => ({ ...s, progress: 'Generating document structure...' }));
      const contentStructure = await generateContentStructure(state.prompt);
      
      const contentWithImages: GeneratedContent = {
        title: contentStructure.title,
        sections: [],
      };

      for (let i = 0; i < contentStructure.sections.length; i++) {
        const section = contentStructure.sections[i];
        setState(s => ({ ...s, progress: `Generating image for section ${i + 1}/${contentStructure.sections.length}...` }));
        const imagePrompt = `An illustrative image for a document section titled "${section.heading}". The content is about: ${section.content.substring(0, 150)}`;
        const imageData = await generateImageForText(imagePrompt);
        
        contentWithImages.sections.push({
          ...section,
          imageUrl: `data:image/png;base64,${imageData}`,
        });
        setState(s => ({ ...s, generatedContent: contentWithImages }));
      }
      
      setState(s => ({ ...s, status: 'success', generatedContent: contentWithImages, progress: 'Generation complete!' }));

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setState(s => ({ ...s, status: 'error', error: `Failed to generate content: ${errorMessage}` }));
    }
  }, [state.prompt]);

  const handleDownload = useCallback(() => {
    if (state.generatedContent) {
        createPdf(state.generatedContent);
    }
  }, [state.generatedContent]);

  const isLoading = state.status === 'loading';

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-2">
                <BrandIcon className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                    AI PDF Pro Creator
                </h1>
            </div>
            <p className="text-lg text-gray-400">Transform your ideas into beautifully illustrated PDF documents with Gemini.</p>
        </header>

        <main className="w-full">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
                <div className="flex flex-col gap-4">
                    <label htmlFor="prompt" className="text-lg font-medium text-gray-300">Enter your topic or idea</label>
                    <textarea
                        id="prompt"
                        value={state.prompt}
                        onChange={(e) => setState(s => ({ ...s, prompt: e.target.value }))}
                        placeholder="e.g., A comprehensive guide to deep sea exploration"
                        className="w-full p-4 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 text-base resize-none"
                        rows={4}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !state.prompt.trim()}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto sm:self-end bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {isLoading ? 'Generating...' : 'Create PDF'}
                    </button>
                </div>
            </div>

            {state.status === 'loading' && (
              <div className="mt-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <p className="mt-4 text-lg text-gray-300">{state.progress}</p>
              </div>
            )}
            
            {state.status === 'error' && (
                <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center gap-3">
                    <ErrorIcon className="w-6 h-6" />
                    <p>{state.error}</p>
                </div>
            )}

            {state.status === 'success' && state.generatedContent && (
                <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <DocumentIcon className="w-7 h-7 text-cyan-400" />
                            <h2 className="text-2xl font-bold">{state.generatedContent.title}</h2>
                        </div>
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <DownloadIcon className="w-5 h-5"/>
                            Download PDF
                        </button>
                    </div>
                    <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-4">
                        {state.generatedContent.sections.map((section, index) => (
                            <div key={index} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                                <h3 className="text-xl font-semibold text-cyan-400 mb-2">{section.heading}</h3>
                                {section.imageUrl && (
                                    <img src={section.imageUrl} alt={section.heading} className="w-full h-48 object-cover rounded-md my-4 shadow-md" />
                                )}
                                <p className="text-gray-300 whitespace-pre-wrap">{section.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;
