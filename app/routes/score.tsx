import { useLocation, useNavigate } from "react-router";

export function meta() {
  return [
    { title: "Your Split Score - Split the G" },
    { name: "description", content: "See how well your Guinness was poured." },
  ];
}

export default function Score() {
  const location = useLocation();
  const navigate = useNavigate();
  const { score = 10, imageUrl } = location.state || {};

  return (
    <main className="flex items-center justify-center min-h-screen bg-guinness-black text-guinness-cream">
      <div className="flex-1 flex flex-col items-center gap-8 p-4 max-w-2xl mx-auto">
        <header className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-guinness-gold tracking-wide">
            Perfect Pour!
          </h1>
          <div className="w-32 h-0.5 bg-guinness-gold my-2"></div>
          <p className="text-xl text-guinness-tan font-light">
            Score: {score}/10
          </p>
        </header>

        <div className="w-full max-w-md aspect-[3/4] bg-guinness-brown/50 rounded-lg overflow-hidden border border-guinness-gold/20 shadow-lg shadow-black/50">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Your Guinness pour"
              className="w-full h-full object-cover"
            />
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