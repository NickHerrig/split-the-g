import { Link } from "react-router";

export function meta() {
  return [
    { title: "FAQ — Split the G App" },
    {
      name: "description",
      content:
        "Frequently asked questions about the Split the G app and challenge",
    },
  ];
}

export default function FAQ() {
  return (
    <main className="min-h-screen bg-guinness-black text-guinness-cream py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-guinness-gold hover:text-guinness-tan transition-colors mb-8"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Split
        </Link>

        <h1 className="text-4xl font-bold text-guinness-gold mb-8">FAQ</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              What is "Split the G"?
            </h2>
            <p className="text-guinness-tan">
              "Split the G" is a popular drinking challenge where you try to sip
              your pint of Guinness so that the foam line stops exactly in the
              middle of the "G" in the Guinness logo. It takes precision,
              patience, and a bit of luck!
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              What does the Split the G app do?
            </h2>
            <p className="text-guinness-tan">
              Our app lets you snap a photo of your Guinness pint and uses
              computer vision to score how well you split the G. It's a fun way
              to compete with friends, settle debates, and track your perfect
              pours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              How does the app score my pint?
            </h2>
            <p className="text-guinness-tan">
              We analyze your photo to detect the Guinness glass and logo, then
              measure how close the foam line is to the center of the "G".
              You'll get a score from 0 to 5 — the closer to a perfect split,
              the higher the score.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              Do I have to drink Guinness to use the app?
            </h2>
            <p className="text-guinness-tan">
              Yes — the app is specifically built to detect the Guinness glass
              and logo. Other drinks or glassware won't work (yet!).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              Is the app free?
            </h2>
            <p className="text-guinness-tan">
              Yep! The app is entirely free to use, with no ads. Premium
              features may come in the future, but the core "Split the G"
              experience is always free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              Can I use the app with older Guinness glasses?
            </h2>
            <p className="text-guinness-tan">
              The app works best with the modern Guinness pint glass with a
              clear "G" logo. Older or worn glasses might not be recognized as
              accurately, but we're always improving the model!
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              Do I need to take the photo at a certain angle?
            </h2>
            <p className="text-guinness-tan">
              Try to take the photo straight-on, with the full logo and foam
              line visible. Good lighting helps too. We'll guide you with tips
              in the app before snapping a pic.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              Can I share my score?
            </h2>
            <p className="text-guinness-tan">
              Yes! After getting your score, you can share your score to
              Instagram, TikTok, or group chat — let the bragging begin. Feel
              free to tag us on Instagram or X with your score!
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-guinness-gold mb-4">
              How can I improve my Split the G score?
            </h2>
            <p className="text-guinness-tan">
              Steady hands, a well-poured pint, and a bit of practice. Take your
              time and aim for that clean, precise sip. We believe in you.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
