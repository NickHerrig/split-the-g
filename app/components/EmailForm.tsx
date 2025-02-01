import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface EmailFormProps {
  scoreId: string;
  show: boolean;
  onComplete: () => void;
}

export function EmailForm({ scoreId, show, onComplete }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Try to get email from cookie
    const savedEmail = Cookies.get('split-g-email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, scoreId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save email');
      }

      // Save email in cookie (expires in 365 days)
      Cookies.set('split-g-email', email, { expires: 365 });
      onComplete(); // Hide form after successful submission
    } catch (error) {
      console.error('Error saving email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptOut = async () => {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          scoreId, 
          emailOptedOut: true 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save opt-out status');
      }
      onComplete(); // Hide form after opting out
    } catch (error) {
      console.error('Error opting out:', error);
    }
  };

  if (!show) return null;

  return (
    <div className="mt-8 max-w-md mx-auto bg-guinness-cream text-guinness-black p-8 rounded-lg relative border-2 border-guinness-gold">
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-guinness-gold px-4 py-1 rounded-full">
        <span className="font-irish text-guinness-black text-lg">Split the G</span>
      </div>
      
      <h2 className="text-3xl font-irish text-center mb-2">Win Big!</h2>
      <p className="text-center mb-6 font-semibold">Take the perfect sip, split the G, and you could win exclusive Guinness merchandise!</p>
      
      <div className="space-y-4 mb-6">
        <p className="text-sm">🎯 Score submitted: Ready to enter the competition</p>
        <p className="text-sm">🎁 Random winner selected after contest ends</p>
        <p className="text-sm">🍺 No purchase necessary to participate</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full p-3 border-2 border-guinness-gold/30 rounded-lg focus:border-guinness-gold focus:outline-none bg-white/90"
          required
        />
        
        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-guinness-gold text-guinness-black py-3 rounded-lg hover:bg-guinness-gold/90 transition-all transform hover:scale-102 font-bold text-lg"
          >
            {isSubmitting ? 'Submitting...' : '🎉 Enter Competition'}
          </button>
          
          <button
            type="button"
            onClick={handleOptOut}
            className="w-full border-2 border-guinness-gold/20 py-2 rounded-lg hover:bg-guinness-black/5 transition-colors text-sm"
          >
            Maybe Later
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-guinness-black/60">
        <p><a href="https://roboflow.com" target="_blank" rel="noopener noreferrer" className="hover:text-guinness-gold transition-colors">Powered by Roboflow</a></p>
        <p className="mt-1">Must be 21 or older to participate. See official rules for details.</p>
      </div>
    </div>
  );
}
