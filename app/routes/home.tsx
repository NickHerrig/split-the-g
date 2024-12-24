import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useFetcher } from "react-router";
import Webcam from "react-webcam";
import { RoboflowLogo } from "../components/RoboflowLogo";
import { PintGlassOverlay } from "../components/PintGlassOverlay";
import type { ActionFunctionArgs } from "react-router";

const isClient = typeof window !== 'undefined';

export async function action({
  request,
}: ActionFunctionArgs) {
  const formData = await request.formData();
  const base64Image = formData.get('image') as string;

  const response = await fetch('https://detect.roboflow.com/infer/workflows/nicks-workspace/split-the-g', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: process.env.ROBOFLOW_API_KEY,
      inputs: {
        "image": {"type": "base64", "value": base64Image}
      }
    })
  });

  if (!response.ok) {
    console.error('API Error:', await response.text());
    throw new Error('Failed to process image');
  }

  const result = await response.json();
  const predictions = result.outputs[0]?.model_predictions?.predictions || [];
  
  // Determine the pour status
  let pourStatus: 'split' | 'not-split' | 'no-glass' = 'no-glass';
  
  if (predictions.length > 0) {
    const hasSplit = predictions.some(
      (pred: { class: string; confidence: number }) => pred.class === "Split"
    );
    const hasNotSplit = predictions.some(
      (pred: { class: string; confidence: number }) => pred.class === "Not-Split"
    );
    
    if (hasSplit) pourStatus = 'split';
    else if (hasNotSplit) pourStatus = 'not-split';
  }

  const visualizationImage = result.outputs[0]?.bounding_box_visualization?.value;
  const fullVisualizationImage = visualizationImage 
    ? `data:image/jpeg;base64,${visualizationImage}` 
    : null;

  return { 
    success: true, 
    pourStatus,
    predictions,
    visualizationImage: fullVisualizationImage 
  };
}

export function meta() {
  return [
    { title: "Split the G - Guinness Pour Analyzer" },
    { name: "description", content: "Test your Guinness pouring skills with AI-powered analysis" },
  ];
}

export default function Home() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Dynamically import and initialize inference engine
  const [inferEngine, setInferEngine] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    async function initInference() {
      const { InferenceEngine, CVImage } = await import('inferencejs');
      setInferEngine(new InferenceEngine());
    }
    
    initInference();
  }, []);

  const [modelWorkerId, setModelWorkerId] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);

  // Initialize model when inference engine is ready
  useEffect(() => {
    if (!inferEngine || modelLoading) return;
    
    setModelLoading(true);
    inferEngine
      .startWorker("split-g-label-experiment", "1", "rf_KknWyvJ8ONXATuszsdUEuknA86p2")
      .then((id) => setModelWorkerId(id));
  }, [inferEngine, modelLoading]);

  const [isVideoReady, setIsVideoReady] = useState(false);

  // Add effect to handle camera initialization
  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;

    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: 720,
        height: 960,
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        setIsCameraActive(false);
      });
  }, [isCameraActive]);

  // Add new state for tracking detections
  const [consecutiveDetections, setConsecutiveDetections] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("Show your pint glass");

  // Update the detection loop with feedback logic
  useEffect(() => {
    if (!isClient || !inferEngine || !modelWorkerId || !isCameraActive || !isVideoReady) return;

    const detectFrame = async () => {
      if (!modelWorkerId || !videoRef.current) return;

      try {
        const { CVImage } = await import('inferencejs');
        const img = new CVImage(videoRef.current);
        const predictions = await inferEngine.infer(modelWorkerId, img);
        
        // Check if any glass is detected
        const hasGlass = predictions.some(pred => 
          pred.class === "glass"
        );

        if (hasGlass) {
          setConsecutiveDetections(prev => prev + 1);
          
          if (consecutiveDetections >= 6) {
            setFeedbackMessage("Perfect! Taking photo...");
            handleCapture();
          } else if (consecutiveDetections >= 3) {
            setFeedbackMessage("Hold still...");
          } else {
            setFeedbackMessage("Keep the glass centered...");
          }
        } else {
          setConsecutiveDetections(0);
          setFeedbackMessage("Show your pint glass");
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    };

    // Run inference exactly twice per second (500ms interval)
    const intervalId = setInterval(detectFrame, 500);

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [modelWorkerId, isCameraActive, inferEngine, isVideoReady, consecutiveDetections]);

  useEffect(() => {
    if (fetcher.data?.success) {
      setIsCameraActive(false);
      navigate('/score', { 
        state: { 
          pourStatus: fetcher.data.pourStatus,
          predictions: fetcher.data.predictions,
          visualizationImage: fetcher.data.visualizationImage
        } 
      });
    }
  }, [fetcher.data, navigate]);

  useEffect(() => {
    if (isCameraActive) {
      setCapturedImage(null);
    }
  }, [isCameraActive]);

  const videoConstraints = {
    facingMode: { ideal: "environment" },
    width: 720,
    height: 960,
  };

  const handleCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        
        const formData = new FormData();
        const base64Image = imageSrc.replace(/^data:image\/\w+;base64,/, '');
        formData.append('image', base64Image);
        formData.append('imageUrl', imageSrc);

        fetcher.submit(formData, { method: 'post' });
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
              <span className="font-medium">Roboflow AI</span>
            </a>
          </div>
          <div className="w-32 h-0.5 bg-guinness-gold my-2"></div>
          <p className="text-lg md:text-xl text-guinness-tan font-light max-w-sm md:max-w-md mx-auto">
            Put your Guinness splitting technique to the test! 
          </p>
        </header>

        <div className="w-full max-w-md flex flex-col gap-4">
          {isCameraActive && (
            <div className="px-8 py-4 
              bg-guinness-black/90 
              text-guinness-gold 
              rounded-2xl
              font-medium 
              text-center
              text-lg
              backdrop-blur-sm
              border border-guinness-gold/20
              shadow-xl
              transform transition-all duration-300 ease-in-out">
              {feedbackMessage}
            </div>
          )}

          <div className="aspect-[3/4] bg-guinness-brown/50 rounded-lg overflow-hidden border border-guinness-gold/20 shadow-lg shadow-black/50">
            {isCameraActive ? (
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  playsInline
                  onLoadedMetadata={() => setIsCameraReady(true)}
                  onCanPlay={() => setIsVideoReady(true)}
                  onError={(err) => {
                    console.error('Camera error:', err);
                    setIsCameraActive(false);
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center translate-y-8">
                  <PintGlassOverlay className="w-80 md:w-96 h-[28rem] md:h-[32rem] text-guinness-gold opacity-50" />
                </div>
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
                  Start Analysis
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
