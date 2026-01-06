import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleHostClick = () => {
    router.push('/host');
  };

  const handleClientClick = () => {
    setIsJoining(true);
    router.push('/client');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold text-white mb-4">
          Distributed Video Wall
        </h1>
        <p className="text-xl text-gray-300 mb-12">
          Create a seamless mosaic display across multiple devices
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button
            onClick={handleHostClick}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 min-w-[200px]"
          >
            Join as Host
          </button>

          <button
            onClick={handleClientClick}
            disabled={isJoining}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining...' : 'Join as Screen'}
          </button>
        </div>

        <div className="mt-16 text-gray-400 text-sm max-w-2xl mx-auto">
          <p className="mb-4">
            <strong>How to use:</strong>
          </p>
          <ol className="list-decimal list-inside space-y-2 text-left">
            <li>Open this page on your laptop/desktop and click &quot;Join as Host&quot;</li>
            <li>Open the same URL on your phone/tablet devices and click &quot;Join as Screen&quot;</li>
            <li>Upload an image or video on the Host device</li>
            <li>Arrange the client rectangles on the Host to match your physical layout</li>
            <li>Watch as the video/image splits across all connected devices!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}



