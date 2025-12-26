import React from 'react';
import { Github } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8 flex justify-center">
          <img 
            width="1200" 
            height="475" 
            alt="GHBanner" 
            src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6"
            className="rounded-lg shadow-xl w-full max-w-3xl"
          />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          Built with AI Studio
        </h1>
        
        <p className="text-xl mb-10 text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          The fastest path from prompt to production with Gemini.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href="https://aistudio.google.com/apps" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            <Github className="mr-2 h-5 w-5" />
            Start building
          </a>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">AI-Powered Development</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Leverage the power of Gemini to accelerate your development process from idea to implementation.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Rapid Prototyping</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Transform your ideas into working applications in minutes, not weeks.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Production Ready</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Built with best practices and modern tooling to ensure your app is ready for deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;