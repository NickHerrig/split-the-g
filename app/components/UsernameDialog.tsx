export function UsernameDialog({ 
  onSubmit, 
  isOpen 
}: { 
  onSubmit: (username: string) => void;
  isOpen: boolean;
}) {
  return isOpen ? (
    <div className="fixed inset-0 bg-guinness-black/95 flex items-center justify-center p-4 z-50">
      <div className="bg-guinness-black border border-guinness-gold/20 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-guinness-gold mb-4">Name Your Split</h2>
        <p className="text-guinness-tan mb-6">
          Give your split a username, or leave it blank to pour anonymously.
        </p>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSubmit(formData.get('username') as string || '');
          }}
          className="space-y-4"
        >
          <input
            type="text"
            name="username"
            placeholder="Enter username"
            className="w-full px-4 py-2 bg-guinness-black border border-guinness-gold/20 rounded-lg text-guinness-cream focus:outline-none focus:border-guinness-gold"
            autoComplete="off"
          />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-guinness-gold text-guinness-black rounded-lg font-medium hover:bg-guinness-tan transition-colors"
          >
            Submit Split
          </button>
        </form>
      </div>
    </div>
  ) : null;
} 