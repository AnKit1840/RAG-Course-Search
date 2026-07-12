import React, { useState } from "react";

export default function LoginPortal({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState("user"); // "user" or "admin"
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(selectedRole, username || (selectedRole === "user" ? "Student" : "Admin"));
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
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 30px 0" }}>
          Select your portal to search transcripts or manage lecture assets.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Optional username */}
          <div style={{ marginBottom: "24px", textAlign: "left" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--text-secondary)",
              marginBottom: "8px"
            }}>
              Your Name (Optional)
            </label>
            <input
              type="text"
              className="search-input"
              style={{ width: "100%", boxSizing: "border-box" }}
              placeholder="e.g. Rahul, Prof. Sharma"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Role selection toggle */}
          <label style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-secondary)",
            marginBottom: "12px",
            textAlign: "left"
          }}>
            Select Access Role
          </label>
          <div className="role-options" style={{
            display: "flex",
            gap: "16px",
            marginBottom: "30px"
          }}>
            <div
              className={`role-card ${selectedRole === "user" ? "active" : ""}`}
              onClick={() => setSelectedRole("user")}
              style={{
                flex: 1,
                padding: "20px 15px",
                border: "2px solid var(--border-color)",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: selectedRole === "user" ? "#eff6ff" : "#ffffff",
                borderColor: selectedRole === "user" ? "var(--primary-color)" : "var(--border-color)",
                boxShadow: selectedRole === "user" ? "0 4px 12px rgba(59, 130, 246, 0.15)" : "none"
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎓</div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "15px" }}>Student Portal</h3>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                Search video chunks & Q&A
              </p>
            </div>

            <div
              className={`role-card ${selectedRole === "admin" ? "active" : ""}`}
              onClick={() => setSelectedRole("admin")}
              style={{
                flex: 1,
                padding: "20px 15px",
                border: "2px solid var(--border-color)",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: selectedRole === "admin" ? "#eff6ff" : "#ffffff",
                borderColor: selectedRole === "admin" ? "var(--primary-color)" : "var(--border-color)",
                boxShadow: selectedRole === "admin" ? "0 4px 12px rgba(59, 130, 246, 0.15)" : "none"
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🛠️</div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "15px" }}>Instructor</h3>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                Upload & Ingest videos
              </p>
            </div>
          </div>

          <button type="submit" className="btn" style={{ width: "100%" }}>
            Launch Portal
          </button>
        </form>
      </div>
    </div>
  );
}
