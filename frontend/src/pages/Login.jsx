import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      navigate("/chat");
    }
  }, [navigate]);

  const login = async (e) => {
    e?.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (remember) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("rememberEmail", email);
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("rememberEmail");
      }

      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError("Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Please enter your details to sign in."
      footerText="Don't have an account?"
      footerLinkText="Create Account"
      footerLinkTo="/register"
      remember={remember}
      onRememberChange={setRemember}
      onGoogleClick={() => alert("Google sign-in coming soon.")}
      onGitHubClick={() => alert("GitHub sign-in coming soon.")}
    >
      <form className="auth-form" onSubmit={login}>
        {error && <div className="auth-error">{error}</div>}

        <div className={`auth-float-field ${email ? "is-filled" : ""}`}>
          <div className="auth-float-inner">
            <label className="auth-float-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            className="auth-arrow-btn"
            disabled={loading}
            aria-label="Sign in"
          >
            <i className="bi bi-arrow-right" />
          </button>
        </div>

        <div className={`auth-float-field auth-float-field--solo ${password ? "is-filled" : ""}`}>
          <div className="auth-float-inner">
            <label className="auth-float-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-toggle-pw"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <i className={`bi bi-eye${showPassword ? "-slash" : ""}`} />
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Login;
