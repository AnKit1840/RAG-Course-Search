import React, { useState } from "react";
import { login, register } from "../services/api";

export default function LoginPortal({ onLogin }) {
  // mode: "select" (Portal selection) | "admin-login" (Instructor Auth Form)
  const [mode, setMode] = useState("select");
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Student Direct Entry Handler
  const handleStudentEntry = () => {
    onLogin({ username: "Student", role: "user" });
  };

  // Instructor Auth Submit Handler
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let data;
      if (isRegistering) {
        data = await register(username, password, "admin");
      } else {
        data = await login(username, password);
      }
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "80vh",
      padding: "20px"
    }}>
      <div className="card login-card" style={{
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        padding: "40px 30px"
      }}>
        <h1 style={{ fontSize: "28px", color: "var(--primary-color)", margin: "0 0 8px 0" }}>
          Video-RAG Assistant
        </h1>

        {mode === "select" ? (
          /* STEP 1: Portal Selection Screen */
          <>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 30px 0" }}>
              Select your portal to start exploring course content or managing lectures.
            </p>

            <div className="role-options" style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "10px"
            }}>
              {/* Student Card -> Direct Entry */}
              <div
                onClick={handleStudentEntry}
                style={{
                  padding: "20px 20px",
                  border: "2px solid var(--border-color)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: "#eff6ff",
                  borderColor: "var(--primary-color)",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.12)"
                }}
              >
                <div style={{ fontSize: "36px" }}>🎓</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#1e3a8a" }}>
                    Student Portal
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                    Ask questions, search video transcripts & jump to timestamps. <strong>Direct Entry</strong>
                  </p>
                </div>
                <span style={{ fontSize: "18px", color: "var(--primary-color)" }}>➔</span>
              </div>

              {/* Instructor Card -> Next interface (Admin Login) */}
              <div
                onClick={() => {
                  setMode("admin-login");
                  setError("");
                }}
                style={{
                  padding: "20px 20px",
                  border: "2px solid var(--border-color)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: "#ffffff",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }}
              >
                <div style={{ fontSize: "36px" }}>🛠️</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "var(--text-primary)" }}>
                    Instructor / Admin
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                    Upload video lectures, trigger AI ingestion & manage database. <strong>Login Required</strong>
                  </p>
                </div>
                <span style={{ fontSize: "18px", color: "#94a3b8" }}>➔</span>
              </div>
            </div>
          </>
        ) : (
          /* STEP 2: Instructor Login / Register Form */
          <>
            <div style={{ textAlign: "left", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  setMode("select");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-color)",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                ← Back to Portal Selection
              </button>
            </div>

            <h2 style={{ fontSize: "20px", color: "var(--text-primary)", margin: "0 0 6px 0", textAlign: "left" }}>
              🛠️ Instructor Access
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 24px 0", textAlign: "left" }}>
              {isRegistering
                ? "Register a new Instructor account."
                : "Sign in with your instructor credentials to manage lectures."
              }
            </p>

            {/* Error banner */}
            {error && (
              <div style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #ef4444",
                color: "#b91c1c",
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                fontWeight: 500,
                textAlign: "left"
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleAdminSubmit}>
              {/* Username */}
              <div style={{ marginBottom: "16px", textAlign: "left" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px"
                }}>
                  Instructor Username
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="Enter instructor username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "24px", textAlign: "left" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "var(--text-secondary)",
                  marginBottom: "8px"
                }}>
                  Password
                </label>
                <input
                  type="password"
                  className="search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder={isRegistering ? "Create password (min 6 chars)" : "Enter password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                />
              </div>

              <button
                type="submit"
                className="btn"
                style={{ width: "100%", opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading
                  ? (isRegistering ? "Registering..." : "Signing In...")
                  : (isRegistering ? "Register as Instructor" : "Login as Instructor")
                }
              </button>
            </form>

            {/* Toggle login / register */}
            <div style={{
              marginTop: "20px",
              fontSize: "13px",
              color: "var(--text-secondary)",
              textAlign: "center"
            }}>
              {isRegistering ? (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(false); setError(""); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-color)",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: 0
                    }}
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  Need an instructor account?{" "}
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(true); setError(""); setUsername(""); setPassword(""); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary-color)",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: 0
                    }}
                  >
                    Create One
                  </button>
                </>
              )}
            </div>

            {/* Hint for default admin */}
            {!isRegistering && (
              <div style={{
                marginTop: "16px",
                padding: "10px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                fontSize: "11px",
                color: "#64748b",
                textAlign: "center"
              }}>
                💡 Default instructor credentials: <strong>admin</strong> / <strong>admin123</strong>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
