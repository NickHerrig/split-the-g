import { useEffect, useRef, useState } from "react";
import { useNavigate, useSubmit, useActionData, redirect } from "react-router";
import { RoboflowLogo } from "../components/RoboflowLogo";
import { PintGlassOverlay } from "../components/PintGlassOverlay";
import type { ActionFunctionArgs } from "react-router";
import { calculateScore } from "~/utils/scoring";
import { uploadImage } from "~/utils/imageStorage";
import { supabase } from "~/utils/supabase";
import { LeaderboardButton } from "../components/LeaderboardButton";
import { SubmissionsButton } from "../components/SubmissionsButton";
import { generateBeerUsername } from "~/utils/usernameGenerator";
import { getLocationData } from "~/utils/locationService";
import { CountryLeaderboardButton } from "../components/CountryLeaderboard";

const isClient = typeof window !== "undefined";

export function meta() {
  return [
    { title: "Split the G Scorer" },
    {
      name: "description",
      content: "Test your Split the G skills with AI-powered analysis",
    },
  ];
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const base64Image = formData.get("image") as string;
  const username = generateBeerUsername();
  const sessionId = crypto.randomUUID();

  console.log(
    "Request headers:",
    Object.fromEntries(request.headers.entries())
  );

  // Prioritize Fly.io headers since we're using Fly hosting
  const clientIP =
    request.headers.get("Fly-Client-IP") ||
    request.headers.get("fly-client-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    request.headers.get("fastly-client-ip") ||
    "unknown";

  console.log("Detected client IP:", clientIP);
  console.log("Using fly-client-ip:", request.headers.get("fly-client-ip"));

  try {
    const response = await fetch(
      "https://detect.roboflow.com/infer/workflows/hunter-diminick/split-g-scoring",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: process.env.ROBOFLOW_API_KEY,
          inputs: {
            image: { type: "base64", value: base64Image },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    // console.log("API Response:", JSON.stringify(result, null, 2));

    // Check specifically in pint results for G class
    const pintPredictions =
      result.outputs?.[0]?.["pint results"]?.predictions?.predictions || [];
    const hasG = pintPredictions.some((pred: any) => pred.class === "G");

    if (!hasG) {
      // console.log("No G detected in pint results");
      return {
        success: false,
        error: "No G detected",
        message: "No G pattern detected",
        status: 400,
      };
    }

    // Add validation for required data
    if (!result.outputs?.[0]) {
      // console.log("No outputs in response");
      throw new Error("No outputs received from API");
    }

    const splitImageData = result.outputs[0]["split image"];
    const pintImageData = result.outputs[0]["pint image"];

    // console.log("Split Image Data:", splitImageData);
    // console.log("Pint Image Data:", pintImageData);

    const splitImage = splitImageData?.[0]?.value;
    const pintImage = pintImageData?.value;

    if (!splitImage || !pintImage) {
      // console.log(
      //   "Missing image data. Split Image:",
      //   !!splitImage,
      //   "Pint Image:",
      //   !!pintImage
      // );
      throw new Error("Missing required image data from API response");
    }

    const splitScore = calculateScore(result.outputs[0]);

    // Upload images to storage
    const splitImageUrl = await uploadImage(splitImage, "split-images");
    const pintImageUrl = await uploadImage(pintImage, "pint-images");

    // Get location data with client IP
    const locationData = await getLocationData(clientIP);

    // Create database record with session_id and location
    const { data: score, error: dbError } = await supabase
      .from("scores")
      .insert({
        split_score: splitScore,
        split_image_url: splitImageUrl,
        pint_image_url: pintImageUrl,
        username: username,
        created_at: new Date().toISOString(),
        session_id: sessionId,
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        country_code: locationData.country_code,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Set the session cookie before redirecting
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `split-g-session=${sessionId}; Path=/; Max-Age=31536000; SameSite=Lax`
    );

    // Redirect to the score page with the ID
    return redirect(`/score/${score.id}`, {
      headers,
    });
  } catch (error) {
    console.error("Error processing image:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Detailed error:", JSON.stringify(error, null, 2));

    return {
      success: false,
      message: "Failed to process image",
      error: errorMessage,
      status: 500,
    };
  }
}

export default function Home() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();

  // Dynamically import and initialize inference engine
  const [inferEngine, setInferEngine] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function initInference() {
      const { InferenceEngine } = await import("inferencejs");
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
      .startWorker(
        "split-g-label-experiment",
        "8",
        "rf_KknWyvJ8ONXATuszsdUEuknA86p2"
      )
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
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setIsCameraActive(false);
      });
  }, [isCameraActive]);

  // Add new state for tracking detections
  const [consecutiveDetections, setConsecutiveDetections] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState(
    "Show your pint glass"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadProcessing, setIsUploadProcessing] = useState(false);
  const [showNoGModal, setShowNoGModal] = useState(false);

  // Update the detection loop with feedback logic
  useEffect(() => {
    if (
      !isClient ||
      !inferEngine ||
      !modelWorkerId ||
      !isCameraActive ||
      !isVideoReady
    )
      return;

    const detectFrame = async () => {
      if (!modelWorkerId || !videoRef.current) return;

      try {
        const { CVImage } = await import("inferencejs");
        const img = new CVImage(videoRef.current);
        const predictions = await inferEngine.infer(modelWorkerId, img);

        const hasGlass = predictions.some((pred) => pred.class === "glass");
        const hasG = predictions.some((pred) => pred.class === "G");

        if (hasGlass && hasG) {
          setConsecutiveDetections((prev) => prev + 1);

          if (consecutiveDetections >= 4) {
            setFeedbackMessage("Perfect! Processing your pour...");
            setIsProcessing(true);
            setIsSubmitting(true);

            if (videoRef.current && canvasRef.current) {
              const canvas = canvasRef.current;
              const context = canvas.getContext("2d");

              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              context?.drawImage(
                videoRef.current,
                0,
                0,
                canvas.width,
                canvas.height
              );

              const imageData = canvas.toDataURL("image/jpeg");
              const base64Image = imageData.replace(
                /^data:image\/\w+;base64,/,
                ""
              );

              // Stop the camera stream
              const stream = videoRef.current.srcObject as MediaStream;
              stream?.getTracks().forEach((track) => track.stop());
              setIsCameraActive(false);

              // Submit form data to action
              const formData = new FormData();
              formData.append("image", base64Image);

              submit(formData, {
                method: "post",
                action: "/?index",
                encType: "multipart/form-data",
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
        console.error("Detection error:", error);
      }
    };

    const intervalId = setInterval(detectFrame, 500);
    return () => clearInterval(intervalId);
  }, [
    modelWorkerId,
    isCameraActive,
    inferEngine,
    isVideoReady,
    consecutiveDetections,
    submit,
  ]);

  // Update the effect that handles action response
  useEffect(() => {
    if (actionData) {
      setIsUploadProcessing(false);
      setIsSubmitting(false);

      // Check if there was an error due to no G detected
      if (actionData.error === "No G detected") {
        // console.log("Showing No G modal", actionData);
        setShowNoGModal(true);
      }
    }
  }, [actionData]);

  // Update the handleFileChange function
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadProcessing(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Image = reader.result
        ?.toString()
        .replace(/^data:image\/\w+;base64,/, "");
      if (base64Image) {
        const formData = new FormData();
        formData.append("image", base64Image);
        submit(formData, {
          method: "post",
          action: "/?index",
          encType: "multipart/form-data",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-guinness-black text-guinness-cream">
      {/* QR Code Modal */}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-guinness-black/95 flex items-center justify-center z-50"
          onClick={() => setShowQRCode(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src="/app/SplitGQRCode.png"
              alt="Split the G QR Code"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setShowQRCode(false)}
              className="absolute top-4 right-4 text-guinness-gold hover:text-guinness-tan transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* QR Code Icon */}
      <button
        onClick={() => setShowQRCode(true)}
        className="fixed top-4 right-4 z-40 p-2 bg-guinness-gold/10 hover:bg-guinness-gold/20 text-guinness-gold border border-guinness-gold/20 rounded-lg transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h6v6H3V3zm12 0h6v6h-6V3zM3 15h6v6H3v-6zm12 0h6v6h-6v-6z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 9h2v2H9V9zm4 0h2v2h-2V9zm0 4h2v2h-2v-2z"
          />
        </svg>
      </button>

      {isUploadProcessing && (
        <div className="fixed inset-0 bg-guinness-black/95 flex flex-col items-center justify-center gap-6 z-50">
          <div className="w-24 h-24 border-4 border-guinness-gold/20 border-t-guinness-gold rounded-full animate-spin"></div>
          <p className="text-guinness-gold text-xl font-medium">
            Processing your image...
          </p>
          <p className="text-guinness-tan text-sm">
            This will just take a moment
          </p>
        </div>
      )}

      {showNoGModal && (
        <div className="fixed inset-0 bg-guinness-black/95 flex flex-col items-center justify-center gap-6 z-50">
          <div className="bg-guinness-black/90 backdrop-blur-sm border border-guinness-gold/20 rounded-2xl p-8 max-w-md mx-4 text-center">
            <p className="text-guinness-gold text-xl font-medium mb-4">
              {actionData?.message || "No G detected"}
            </p>
            <p className="text-guinness-tan text-sm mb-6">
              Please make sure the G pattern is clearly visible in your image
              and try again.
            </p>
            <button
              onClick={() => setShowNoGModal(false)}
              className="px-6 py-2 bg-guinness-gold text-guinness-black rounded-lg hover:bg-guinness-tan transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {isSubmitting ? (
        <div className="fixed inset-0 bg-guinness-black/95 flex flex-col items-center justify-center gap-6 z-50">
          <div className="w-24 h-24 border-4 border-guinness-gold/20 border-t-guinness-gold rounded-full animate-spin"></div>
          <p className="text-guinness-gold text-xl font-medium">
            Analyzing your split...
          </p>
          <p className="text-guinness-tan text-sm">
            This will just take a moment
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center gap-8 p-4 max-w-2xl mx-auto">
          <header className="flex flex-col items-center gap-4 md:gap-6 text-center px-2 md:px-4">
            <h1 className="text-3xl md:text-5xl font-bold text-guinness-gold tracking-wide">
              Split the G
            </h1>
            <div className="flex items-center gap-1 md:gap-2 text-guinness-tan text-xs md:text-sm">
              <span>Powered by</span>
              <a
                href="https://roboflow.com/?ref=splittheg"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 md:gap-1.5 transition-colors duration-300 hover:opacity-80"
                style={{ color: "#8315f9" }}
              >
                <RoboflowLogo className="h-8 w-8 md:h-10 md:w-10" />
                <span className="font-bold text-base md:text-[22px]">
                  Roboflow AI
                </span>
              </a>
            </div>
            <div className="w-24 md:w-32 h-0.5 bg-guinness-gold my-1 md:my-2"></div>
            <p className="text-base md:text-xl text-guinness-tan font-light max-w-[280px] md:max-w-md mx-auto">
              Put your Guinness splitting technique to the test!
            </p>
            <a
              href="https://blog.roboflow.com/split-the-g-app/?ref=splittheg"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs md:text-sm text-guinness-gold hover:text-guinness-cream transition-colors duration-300"
            >
              How we built this →
            </a>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full px-2">
              <LeaderboardButton />
              <SubmissionsButton />
              <CountryLeaderboardButton />
            </div>
          </header>

          <div className="w-full max-w-md flex flex-col gap-4">
            {isCameraActive && (
              <div className="px-8 py-4 bg-guinness-black/90 backdrop-blur-sm border border-guinness-gold/20 text-guinness-gold rounded-2xl shadow-lg">
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="font-medium tracking-wide">
                      {feedbackMessage}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="font-medium tracking-wide">
                      {feedbackMessage}
                    </span>
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
                      console.error("Camera error:", err);
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
            onClick={() => document.getElementById("file-upload")?.click()}
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

          {/* Add social media buttons */}
          <div className="flex gap-4 mt-4 w-3/4 justify-center">
            <a
              href="https://x.com/SplitTheGScorer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-guinness-gold/10 hover:bg-guinness-gold/20 text-guinness-gold border border-guinness-gold/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </a>
            <a
              href="https://www.instagram.com/splitthegscorer/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-guinness-gold/10 hover:bg-guinness-gold/20 text-guinness-gold border border-guinness-gold/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>Instagram</span>
            </a>
          </div>
          <p className="text-base md:text-xl text-guinness-tan font-light max-w-[280px] md:max-w-md mx-auto text-center">
            Tag us on X or Instagram for a chance to be featured on our Wall of
            Fame (Coming Soon)!
          </p>
        </div>
      )}
    </main>
  );
}
