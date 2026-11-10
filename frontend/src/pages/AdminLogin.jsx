
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, Eye, EyeOff } from "lucide-react";

import API from "../services/api";
import "../styles/admin-login.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      // Endpoint will be confirmed from admin.py
      const response = await API.post("/admin/login", {
        email,
        password,
      });

      const { access_token, token_type, expires_in } = response.data;

      sessionStorage.setItem("access_token", access_token);
      sessionStorage.setItem("token_type", token_type);
      sessionStorage.setItem("expires_in", expires_in);

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);

      setError(
        err.response?.data?.detail ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-login-logo">
          <LockKeyhole size={32} />
        </div>

        <h1>Admin Login</h1>
        <p className="admin-login-subtitle">
          NIE PDF HUB Management Portal
        </p>

        <form onSubmit={handleLogin}>

          <label>Email Address</label>

          <div className="admin-input-group">
            <Mail size={19} />
            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Password</label>

          <div className="admin-input-group">
            <LockKeyhole size={19} />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {error && (
            <p className="admin-login-error">{error}</p>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="admin-login-footer">
          Authorized administrators only
        </p>

      </div>
    </div>
  );
}

export default AdminLogin;
