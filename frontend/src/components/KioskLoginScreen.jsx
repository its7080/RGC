import React, { useState } from 'react';

export function KioskLoginScreen({ onLogin, error = '', isSubmitting = false, onBack }) {
  const [username, setUsername] = useState('kiosk');
  const [password, setPassword] = useState('kiosk123');
  const [rememberMe, setRememberMe] = useState(true);

  const submitLogin = (event) => {
    event.preventDefault();
    onLogin({ username, password, rememberMe });
  };

  return (
    <section className="kiosk-login-screen" aria-label="Members login screen">
      <div className="kiosk-bg-pattern" />

      <aside className="kiosk-age-banner" aria-label="Age warning">
        <span className="badge">18+</span>
        <div>
          <div className="headline">STRICTLY FOR AMUSEMENT ONLY</div>
          <div className="subline">You should be 18 years and above to use this site</div>
        </div>
      </aside>

      <div className="kiosk-window-controls" aria-hidden>
        <button type="button">−</button>
        <button type="button">×</button>
      </div>

      <div className="kiosk-version-text">
        <div>Server Version: 16</div>
        <div>Running Version: 14</div>
      </div>

      <div className="kiosk-visual-brand" aria-hidden>
        <div className="kiosk-jewel-ring">♠ ♥ ♦ ♣ ♠ ♥ ♦ ♣</div>
        <div className="kiosk-royal-logo">
          <span>Royal</span>
          <span>Casino</span>
        </div>
      </div>

      <section className="members-panel">
        <header className="members-panel-head">MEMBERS LOGIN</header>
        <div className="members-panel-subhead">FOR AMUSEMENT ONLY</div>

        <form className="members-form" onSubmit={submitLogin}>
          <label>
            USER NAME
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>

          <label>
            <span className="password-row">
              <span>PASSWORD</span>
              <span className="remember-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember Me</span>
              </span>
            </span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <button type="submit" className="kiosk-login-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
          {onBack && (
            <button type="button" className="kiosk-login-btn" onClick={onBack}>
              Back
            </button>
          )}
          {error && <p className="kiosk-login-error">{error}</p>}
          <div className="signup-text">NEW USER? SIGN UP HERE</div>
        </form>
      </section>

      <aside className="kiosk-benefits">
        <p># Register &amp; <strong>PLAY FOR FREE</strong></p>
        <p># Get <strong>100 FREE CHIPS</strong> on every login</p>
        <p># Great <strong>PRIZES &amp; GIFTS</strong> to be won</p>
        <p># <strong>NO DEPOSITS</strong> or charges required</p>
        <p># No Redemption or Cash Winnings.</p>
      </aside>

      <aside className="free-play-badge">FREE TO PLAY</aside>
    </section>
  );
}
