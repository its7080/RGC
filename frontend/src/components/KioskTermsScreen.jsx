import React from 'react';

const terms = [
  'User needs to register for playing the game.',
  'Initially user will be credited points to play; winning points are credited back to user account for further play.',
  'The platform may credit points to registered accounts randomly.',
  'This is amusement gameplay and cannot be treated as a lottery; no money transaction is involved in the web application.',
  'The platform is not responsible for legal complexities created by Government administration.'
];

export function KioskTermsScreen({ onAgree }) {
  return (
    <section className="kiosk-terms-screen" aria-label="Terms and condition screen">
      <div className="kiosk-bg-pattern" />

      <aside className="kiosk-age-banner" aria-label="Age warning">
        <span className="badge">18+</span>
        <div>
          <div className="headline">STRICTLY FOR AMUSEMENT ONLY</div>
          <div className="subline">You should be 18 years and above to use this site</div>
        </div>
      </aside>

      <div className="terms-logo-sign" role="img" aria-label="Royal Casino">
        <span>Royal</span>
        <span>Casino</span>
      </div>

      <article className="terms-card">
        <header className="terms-header">TERMS &amp; CONDITION</header>
        <div className="terms-body">
          <p><strong>Dear Player, welcome to Royal Casino.</strong></p>
          <p>
            We are happy to provide you a game for entertainment. Please review these conditions before continuing.
          </p>
          <ol>
            {terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
          <p className="terms-footnote">
            To play game, click on <strong>I AGREE</strong> button. Otherwise close browser to leave.
          </p>
        </div>
      </article>

      <button className="agree-btn-kiosk" onClick={onAgree}>I AGREE</button>
    </section>
  );
}
