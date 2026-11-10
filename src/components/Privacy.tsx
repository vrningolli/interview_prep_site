/* Plain-language privacy page (#privacy). Keep it in sync with src/analytics.ts,
   worker/index.js (handleEvent) and the AI providers in src/interview/. */
export default function Privacy() {
  return (
    <main className="privacy">
      <span className="kicker">Privacy</span>
      <h1>Your data, in plain English</h1>
      <p className="privacy-lead">
        Prep Hub has no accounts. Your progress lives in your own browser, and we collect only anonymous usage
        counts to learn which features help.
      </p>

      <h2>Stored in your browser only</h2>
      <p>
        Your study plan, ticked tasks, problem log, STAR stories, flashcard reviews, mock interview transcripts and
        scorecards, and settings are saved in your browser's local storage. They never reach our servers. Clearing your
        browser's site data deletes them. Company Prep has Export and Import buttons so you can keep a backup.
      </p>

      <h2>Anonymous usage analytics</h2>
      <p>When you use the site we record small events such as “opened System Design” or “finished a mock interview”. Each event holds:</p>
      <ul>
        <li>the event name, a short detail (for example which problem), and a number (for example a score)</li>
        <li>the page, and your country (from the network, not your IP address)</li>
        <li>a random ID created in your browser, so we can count unique and returning visitors</li>
      </ul>
      <p>
        If you click <i>Upgrade to Pro</i>, we record that click (plan, billing period, currency and where you clicked)
        and your answer to “is this price fair?”, in the same anonymous way. Payments aren't switched on yet, so nothing
        is ever charged.
      </p>
      <p>
        We do <b>not</b> store names, emails, IP addresses or cookies, and we can't link the random ID to you. Events
        are not sent when your browser has <i>Do Not Track</i> turned on. They are stored in Cloudflare Workers
        Analytics Engine.
      </p>

      <h2>The AI interviewer</h2>
      <ul>
        <li>
          <b>Free model:</b> your messages and scratchpad go to our server and on to Cloudflare Workers AI to generate
          the reply. We don't store them.
        </li>
        <li>
          <b>Your own Claude API key:</b> your messages go straight from your browser to Anthropic. Our server never
          sees them or your key. Your key stays in this browser tab unless you tick “Remember”.
        </li>
        <li>
          <b>Voice mode</b> uses your browser's built-in speech features. Some browsers send audio to their own speech
          service (for example Google or Apple) to transcribe it.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions or a deletion request? Since we hold nothing that identifies you, there's nothing to delete on our
        side — clearing your browser's site data removes everything stored locally.
      </p>
      <p className="privacy-updated">Last updated November 2026.</p>
    </main>
  );
}
