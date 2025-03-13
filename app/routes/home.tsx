import { useEffect, useRef, useState } from "react";
import { useNavigate, useSubmit, useActionData, redirect, useLocation } from "react-router";
import { RoboflowLogo } from "../components/RoboflowLogo";
import { PintGlassOverlay } from "../components/PintGlassOverlay";
import type { ActionFunctionArgs } from "react-router";
import { calculateScore } from "~/utils/scoring";
import { uploadImage } from "~/utils/imageStorage";
import { supabase } from "~/utils/supabase";
import { LeaderboardButton } from "../components/LeaderboardButton";
import { generateBeerUsername } from "~/utils/usernameGenerator";

const isClient = typeof window !== 'undefined';

export function meta() {
  return [
    { title: "Split the G Scorer" },
    { name: "description", content: "Test your Split the G skills with AI-powered analysis" },
  ];
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const base64Image = formData.get('image') as string;
  const username = generateBeerUsername();
  const sessionId = crypto.randomUUID();

  try {
    const response = await fetch('https://detect.roboflow.com/infer/workflows/hunter-diminick/split-g-scoring', {
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
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.outputs?.[0]) {
      return { success: false, error: "We couldn't find a Guinness glass in your image. Make sure the G pattern is clearly visible." };
    }

    const splitImage = result.outputs[0]['split image']?.[0]?.value;
    const pintImage = result.outputs[0]['pint image']?.value;

    if (!splitImage || !pintImage) {
      return { success: false, error: "We couldn't find a Guinness glass in your image. Make sure the G pattern is clearly visible." };
    }

    const splitScore = calculateScore(result.outputs[0]);

    // Upload images to storage
    const splitImageUrl = await uploadImage(splitImage, 'split-images');
    const pintImageUrl = await uploadImage(pintImage, 'pint-images');

    // Create database record with session_id
    const { data: score, error: dbError } = await supabase
      .from('scores')
      .insert({
        split_score: splitScore,
        split_image_url: splitImageUrl,
        pint_image_url: pintImageUrl,
        username: username,
        created_at: new Date().toISOString(),
        session_id: sessionId
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Set the session cookie before redirecting
    const headers = new Headers();
    headers.append('Set-Cookie', `split-g-session=${sessionId}; Path=/; Max-Age=31536000; SameSite=Lax`);

    // Redirect to the score page with the ID
    return { success: true, splitScore: splitScore, visualizationImages: result.outputs };

  } catch (error) {
    console.error('Error processing image:', error);
    return { success: false, error: "Unable to analyze image" };
  }
}

export default function Home() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();
  const location = useLocation();
  
  // Dynamically import and initialize inference engine
  const [inferEngine, setInferEngine] = useState<any>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    async function initInference() {
      const { InferenceEngine } = await import('inferencejs');
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
      .startWorker("split-g-label-experiment", "8", "rf_KknWyvJ8ONXATuszsdUEuknA86p2")
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update the detection loop with feedback logic
  useEffect(() => {
    if (!isClient || !inferEngine || !modelWorkerId || !isCameraActive || !isVideoReady) return;

    const detectFrame = async () => {
      if (!modelWorkerId || !videoRef.current) return;

      try {
        const { CVImage } = await import('inferencejs');
        const img = new CVImage(videoRef.current);
        const predictions = await inferEngine.infer(modelWorkerId, img);
        
        const hasGlass = predictions.some(pred => pred.class === "glass");
        const hasG = predictions.some(pred => pred.class === "G");

        if (hasGlass && hasG) {
          setConsecutiveDetections(prev => prev + 1);
          
          if (consecutiveDetections >= 4) {
            setFeedbackMessage("Perfect! Processing your pour...");
            setIsProcessing(true);
            setIsSubmitting(true);

            if (videoRef.current && canvasRef.current) {
              const canvas = canvasRef.current;
              const context = canvas.getContext('2d');
              
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              
              const imageData = canvas.toDataURL('image/jpeg');
              const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');

              // Stop the camera stream
              const stream = videoRef.current.srcObject as MediaStream;
              stream?.getTracks().forEach(track => track.stop());
              setIsCameraActive(false);

              // Submit form data to action
              const formData = new FormData();
              formData.append('image', base64Image);
              
              submit(formData, {
                method: 'post',
                action: '/?index',
                encType: 'multipart/form-data',
              });
            }
            return; // Exit the detection loop
          }
          if (consecutiveDetections >= 1) {
            setFeedbackMessage("Hold still...");
          } else {
            setFeedbackMessage("Keep the glass centered...");
          }
        } else {
          setConsecutiveDetections(0);
          if (!hasGlass) {
            setFeedbackMessage("Show your pint glass");
          } else if (!hasG) {
            setFeedbackMessage("Make sure the G pattern is visible");
          }
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    };

    const intervalId = setInterval(detectFrame, 500);
    return () => clearInterval(intervalId);
  }, [modelWorkerId, isCameraActive, inferEngine, isVideoReady, consecutiveDetections, submit]);

  // Add effect to handle action response
  useEffect(() => {
    if (actionData) {
      setIsSubmitting(false);
      if (!actionData.success) {
        setAnalysisError(actionData.error);
      } else {
        // If successful, clear any existing error
        setAnalysisError(null);
      }
    }
  }, [actionData]);

  // Add effect to handle loading state reset on navigation
  useEffect(() => {
    // Reset loading states and error state when component mounts or URL changes
    setIsUploading(false);
    setIsSubmitting(false);
    setAnalysisError(null);
  }, [location.pathname, location.search]);

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Add the handleFileChange function inside the component
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result?.toString().replace(/^data:image\/\w+;base64,/, '');
      if (base64Image) {
        const formData = new FormData();
        formData.append('image', base64Image);
        submit(formData, {
          method: 'post',
          action: '/?index',
          encType: 'multipart/form-data',
        });
      }
      // Reset the file input
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-guinness-black text-guinness-cream">
      {analysisError && (
        <div className="fixed inset-0 bg-guinness-black/95 flex flex-col items-center justify-center gap-6 z-50">
          <div className="text-center max-w-md px-6">
            <svg 
              className="mx-auto h-16 w-16 text-guinness-gold mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h3 className="text-xl font-bold text-guinness-gold mb-2">Analysis Failed</h3>
            <p className="text-guinness-tan mb-6">{analysisError}</p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  setAnalysisError(null);
                  setIsCameraActive(false);
                  setIsUploading(false);
                  setIsSubmitting(false);
                }}
                className="px-6 py-3 bg-guinness-gold text-guinness-black rounded-lg hover:bg-guinness-tan transition-colors duration-300"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  setAnalysisError(null);
                  navigate('/', { replace: true });
                }}
                className="px-6 py-3 bg-guinness-gold/10 text-guinness-gold rounded-lg hover:bg-guinness-gold/20 transition-colors duration-300"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
      {(isSubmitting || isUploading) && !analysisError ? (
        <div className="fixed inset-0 bg-guinness-black/95 flex flex-col items-center justify-center gap-6 z-50">
          <div className="w-24 h-24 border-4 border-guinness-gold/20 border-t-guinness-gold rounded-full animate-spin"></div>
          <p className="text-guinness-gold text-xl font-medium">Analyzing your split...</p>
          <p className="text-guinness-tan text-sm">This will just take a moment</p>
        </div>
      ) : (
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
                className="flex items-center gap-1.5 transition-colors duration-300 hover:opacity-80" 
                style={{ color: "#8315f9" }}

                //className="flex items-center gap-1.5 text-guinness-gold hover:text-guinness-cream transition-colors duration-300"
              >
                <RoboflowLogo className="h-10 w-10" />
                <span className="font-bold" style={{ fontSize: "22px" }}>Roboflow AI</span>
              </a>
            </div>
            <div className="w-32 h-0.5 bg-guinness-gold my-2"></div>
            <p className="text-lg md:text-xl text-guinness-tan font-light max-w-sm md:max-w-md mx-auto">
              Put your Guinness splitting technique to the test!
            </p>
            <a 
              href="https://blog.roboflow.com/split-the-g-app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-guinness-gold hover:text-guinness-cream transition-colors duration-300"
            >
              How we built this →
            </a>
            <LeaderboardButton />
          </header>

          <div className="w-full max-w-md flex flex-col gap-4">
            {isCameraActive && (
              <div className="px-8 py-4 bg-guinness-black/90 backdrop-blur-sm border border-guinness-gold/20 text-guinness-gold rounded-2xl shadow-lg">
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="font-medium tracking-wide">{feedbackMessage}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="font-medium tracking-wide">{feedbackMessage}</span>
                  </div>
                )}
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
                    onLoadedMetadata={() => setIsVideoReady(true)}
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
                <>
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
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="w-3/4 mt-4 py-2 px-4 bg-guinness-gold text-guinness-black rounded-lg hover:bg-guinness-tan transition-colors duration-300"
          >
            Upload an Image
          </button>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-8 text-guinness-tan text-sm">
            <h2 className="text-lg font-bold">How to enter the Split the G contest:</h2>
            <p>Follow the below steps before 11:59pm PST March 17, 2025.</p>
            <ol className="list-decimal list-inside mt-2">
              <li><strong>Receive a score</strong>: Hit the <strong>Start Analysis</strong> button on the website, aim your camera at the pint glass to capture an image, and let the website generate your score (the closer you are to the middle of the G logo, the better the score).</li>
              <li><strong>Submit your score</strong>: Hit the <strong>Submit score</strong> button to submit your score to the leaderboard, fill out your contact information, and hit the <strong>Enter the contest</strong> button.</li>
              <li><strong>All done!</strong></li>
            </ol>

            <h2 className="text-lg font-bold mt-4">Contest Rules:</h2>
            <ul className="list-disc list-inside mt-2">
              <li>Entry Period: Contest begins January 1, 2025 and ends 11:59pm PST March 17, 2025.</li>
              <li>Prize: Commemorative item!</li>
              <li>Winner Selection: The winner will be randomly selected from all eligible entries.</li>
              <li>Eligibility: Must submit email to enter.</li>
              <li>Winner Notification: The winner will be notified via the email provided upon submission within 10 business days of the contest end date.</li>
              <li>No Purchase Necessary: Entering the contest does not require any purchase.</li>
              <li>Multiple Entries: Multiple entries are allowed, but each entry must be submitted separately.</li>
              <li>Disqualification: Any attempt to manipulate the contest or submit fraudulent entries will result in disqualification.</li>
              <li>Privacy: Your email and personal information will be used solely for the purpose of this contest and will not be shared with third parties.</li>
              <li>Acceptance of Rules: By entering the contest, you agree to abide by these rules and the decisions of the contest organizers.</li>
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
