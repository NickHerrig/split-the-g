import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router";
import { RoboflowLogo } from "../components/RoboflowLogo";
import { PintGlassOverlay } from "../components/PintGlassOverlay";

export function Welcome() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();

  const videoConstraints = {
    facingMode: { ideal: "environment" },
    width: 720,
    height: 960,
  };

  const handleCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Stop the camera
        setIsCameraActive(false);
        
        navigate('/score', { 
          state: { 
            score: 8.5, 
            imageUrl: imageSrc // Already in base64 format
          } 
        });
      }
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-guinness-black text-guinness-cream">
      <div className="flex-1 flex flex-col items-center gap-8 p-4 max-w-2xl mx-auto">
        <header className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-guinness-gold tracking-wide">
            Split the G
          </h1>
          <div className="flex items-center gap-2 text-guinness-tan text-sm">
            <span>Powered by</span>
            <a 
              href="https://roboflow.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-guinness-gold hover:text-guinness-cream transition-colors duration-300"
            >
              <RoboflowLogo className="h-5 w-5" />
              <span className="font-medium">Roboflow</span>
            </a>
          </div>
          <div className="w-32 h-0.5 bg-guinness-gold my-2"></div>
          <p className="text-lg md:text-xl text-guinness-tan font-light max-w-sm md:max-w-md mx-auto">
            Take a picture of your Guinness pint and we'll score your split
          </p>
        </header>

        <div className="w-full max-w-md aspect-[3/4] bg-guinness-brown/50 rounded-lg overflow-hidden border border-guinness-gold/20 shadow-lg shadow-black/50">
          {isCameraActive ? (
            <div className="relative h-full w-full">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="absolute inset-0 w-full h-full object-cover"
                mirrored={false}
                onUserMedia={() => setIsCameraReady(true)}
                onUserMediaError={(err) => {
                  console.error('Camera error:', err);
                  setIsCameraActive(false);
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PintGlassOverlay className="w-56 md:w-64 h-80 md:h-96 text-guinness-gold opacity-50" />
              </div>
              <button
                onClick={handleCapture}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 
                  px-8 py-4 md:py-3 
                  bg-guinness-gold 
                  text-guinness-black 
                  rounded-full 
                  font-bold 
                  text-base md:text-lg 
                  shadow-xl 
                  active:scale-95 
                  transition-all duration-200 
                  hover:bg-guinness-tan 
                  active:bg-guinness-tan
                  min-w-[200px] 
                  touch-none 
                  select-none 
                  focus:outline-none 
                  focus:ring-2 
                  focus:ring-guinness-gold 
                  focus:ring-offset-2"
              >
                Score my Split G
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCameraActive(true)}
              className="w-full h-full flex flex-col items-center justify-center gap-4 text-guinness-gold hover:text-guinness-tan transition-colors duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 md:h-20 w-16 md:w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-lg md:text-xl font-medium">
                Open Camera
              </span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
