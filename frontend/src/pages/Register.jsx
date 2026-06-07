import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
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

  const register = async (e) => {
    e?.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });

      if (remember) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("token", res.data.token);
        sessionStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      navigate("/chat");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Try a different email or username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Please enter your details to get started."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/login"
      remember={remember}
      onRememberChange={setRemember}
      onGoogleClick={() => alert("Google sign-up coming soon.")}
      onGitHubClick={() => alert("GitHub sign-up coming soon.")}
    >
      <form className="auth-form" onSubmit={register}>
        {error && <div className="auth-error">{error}</div>}

        <div className={`auth-float-field auth-float-field--solo ${username ? "is-filled" : ""}`}>
          <div className="auth-float-inner">
            <label className="auth-float-label" htmlFor="reg-username">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              autoComplete="username"
            />
          </div>
        </div>

        <div className={`auth-float-field ${email ? "is-filled" : ""}`}>
          <div className="auth-float-inner">
            <label className="auth-float-label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
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
            aria-label="Create account"
          >
            <i className="bi bi-arrow-right" />
          </button>
        </div>

        <div className={`auth-float-field auth-float-field--solo ${password ? "is-filled" : ""}`}>
          <div className="auth-float-inner">
            <label className="auth-float-label" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              autoComplete="new-password"
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

export default Register;
