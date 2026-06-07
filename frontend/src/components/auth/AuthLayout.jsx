import { Link } from "react-router-dom";
import "./auth.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const LogoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="4" stroke="white" strokeWidth="1.5" opacity="0.9" />
    <path
      d="M12 7.5L16.5 12L12 16.5L7.5 12L12 7.5Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const AuthLayout = ({
  title = "Welcome back",
  subtitle = "Please enter your details to sign in.",
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
  showSocial = true,
  showRemember = true,
  remember,
  onRememberChange,
  onGoogleClick,
  onGitHubClick,
}) => {
  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-beam" />
        <div className="auth-bg-noise" />
      </div>

      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-logo-icon">
            <LogoIcon />
          </div>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
        </header>

        {children}

        {showRemember && (
          <label className="auth-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => onRememberChange?.(e.target.checked)}
            />
            <span className="auth-check-box" />
            <span>Remember me</span>
          </label>
        )}

        {showSocial && (
          <>
            <div className="auth-or">
              <span className="auth-or-line" />
              <span className="auth-or-text">OR</span>
              <span className="auth-or-line" />
            </div>

            <div className="auth-social-list">
              <button type="button" className="auth-social-btn" onClick={onGoogleClick}>
                <span className="auth-social-icon">
                  <GoogleIcon />
                </span>
                <span className="auth-social-label">Continue with Google</span>
                <span className="auth-social-arrow">
                  <i className="bi bi-arrow-right" />
                </span>
              </button>

              <button type="button" className="auth-social-btn" onClick={onGitHubClick}>
                <span className="auth-social-icon">
                  <GitHubIcon />
                </span>
                <span className="auth-social-label">Continue with GitHub</span>
                <span className="auth-social-arrow">
                  <i className="bi bi-arrow-right" />
                </span>
              </button>
            </div>
          </>
        )}

        {footerText && (
          <p className="auth-footer">
            {footerText}
            <Link to={footerLinkTo}>{footerLinkText}</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthLayout;
