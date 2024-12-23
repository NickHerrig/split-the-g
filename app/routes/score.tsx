import { useLocation, useNavigate } from "react-router";
import { RoboflowLogo } from "../components/RoboflowLogo";

export function meta() {
  return [
    { title: "Your Split Score - Split the G" },
    { name: "description", content: "See how well your Guinness was poured." },
  ];
}

export default function Score() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { pourStatus, predictions, visualizationImage } = location.state || {};

  const getMessageContent = (status: string | undefined) => {
    switch (status) {
      case 'split':
        return {
          heading: 'Nice Split!',
          description: "You've mastered the art of splitting the G. Give it another go, but drink responsibly."
        };
      case 'not-split':
        return {
          heading: 'Not Quite!',
          description: "My Grandma could do better! Give it another go, just remember to drink responsibly while you perfect that technique."
        };
      case 'no-glass':
        return {
          heading: 'No Guinness Glass Detected',
          description: "Make sure you're using an official Guinness glass and it's clearly visible in the image."
        };
      default:
        return {
          heading: 'Analysis Error',
          description: 'Something went wrong while analyzing your pour. Please try again.'
        };
    }
  };

  const messageContent = getMessageContent(pourStatus);

  return (
    <main className="flex items-center justify-center min-h-screen bg-guinness-black text-guinness-cream">
      <div className="flex-1 flex flex-col items-center gap-8 p-4 max-w-2xl mx-auto">
        <header className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-guinness-gold tracking-wide">
            {messageContent.heading}
          </h1>
          <p className="text-lg md:text-xl text-guinness-tan font-light max-w-sm md:max-w-md mx-auto">
            {messageContent.description}
          </p>
          <div className="w-32 h-0.5 bg-guinness-gold my-2"></div>
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
        </header>

        <div className="w-full max-w-md aspect-[3/4] bg-guinness-brown/50 rounded-lg overflow-hidden border border-guinness-gold/20 shadow-lg shadow-black/50">
          {visualizationImage ? (
            <img 
              src={visualizationImage} 
              alt="Your Guinness pour"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Image failed to load:', e);
                const img = e.target as HTMLImageElement;
                console.log('Failed image src:', img.src.substring(0, 50));
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-guinness-tan">
              No visualization available
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-guinness-gold text-guinness-black rounded-full font-bold hover:bg-guinness-tan active:bg-guinness-tan transition-colors duration-300 shadow-lg text-lg"
        >
          Score Another Pint
        </button>
      </div>
    </main>
  );
} 