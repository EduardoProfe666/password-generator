import PasswordGenerator from "./components/PasswordGenerator";
import BruteForceSimulator from "./components/BruteForceSimulator";
import SecurityTips from "./components/SecurityTips";
import { Briefcase, Key } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 relative">
          {/* Animated Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative w-20 h-20 animate-bounce">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-45 transform transition-transform hover:scale-110">
                <Key className="w-12 h-12 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45" />
              </div>
            </div>
          </div>

          {/* Title and description */}
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-6">
            Password Generator
          </h1>
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Generate secure and robust passwords
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Includes brute force simulator and security tips to keep your
              accounts protected
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <PasswordGenerator />
          <BruteForceSimulator />
          <SecurityTips />
        </div>
      </div>

      {/* Portfolio link */}
      <div className="group fixed bottom-4 right-4">
        <div className="relative">
          <a
            href="https://eduardoprofe666.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:rotate-3"
            aria-label="Portfolio"
          >
            <Briefcase className="w-6 h-6" />
          </a>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 w-auto min-w-max p-2 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 pointer-events-none border border-gray-700/50">
            Visit Portfolio
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
