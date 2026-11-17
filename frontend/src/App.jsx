import { useState, useEffect } from "react";
import UserPortal from "./components/UserPortal";
import AdminPortal from "./components/AdminPortal";
import LoginPortal from "./components/LoginPortal";
import { getMe, logout as apiLogout } from "./services/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { id, username, role }
  const [activeTab, setActiveTab] = useState("user"); // "user" or "admin"
  const [notification, setNotification] = useState("");
  const [checkingSession, setCheckingSession] = useState(true); // loading state for session check

  // On mount, check if a valid session cookie already exists (auto-login on refresh)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await getMe();
        if (user) {
          setCurrentUser(user);
          setActiveTab(user.role === "admin" ? "admin" : "user");
          setIsLoggedIn(true);
        }
      } catch (err) {
        // No valid session — that's fine, show login
        console.log("No active session found.");
      } finally {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (user) => {
    // user = { id, username, role } from the API response
    setCurrentUser(user);
    setActiveTab(user.role === "admin" ? "admin" : "user");
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.error("Logout error:", err.message);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleIngestComplete = (filename) => {
    setNotification(`Successfully processed "${filename}"! Extracted semantic text chunks & synchronized vector search index.`);
    setTimeout(() => {
      setNotification("");
    }, 5000);
  };

  // Show a loading state while checking for existing session
  if (checkingSession) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "80vh",
        fontSize: "16px",
        color: "var(--text-secondary)"
      }}>
        Checking session...
      </div>
    );
  }

  // If not logged in, render the login page
  if (!isLoggedIn) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Notifications bar */}
      {notification && (
        <div style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #10b981",
          color: "#065f46",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 500
        }}>
          <span>✅ {notification}</span>
          <button
            onClick={() => setNotification("")}
            style={{ background: "none", border: "none", color: "#065f46", fontWeight: "bold", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <header className="app-header">
        <div className="app-logo">
          <h1>Video-RAG Assistant</h1>
          <p>Semantic Navigation & Q&A Assistant for E-Learning Courses</p>
        </div>
        
        {/* User Identity and Logout */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px"
        }}>
          <div style={{
            textAlign: "right",
            fontSize: "13px"
          }}>
            <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>
              {currentUser.username}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>
              {currentUser.role === "admin" ? "🛠️ Instructor" : "🎓 Student"}
            </div>
          </div>
          <button
            className="tab-btn"
            style={{ fontSize: "13px", padding: "6px 12px" }}
            onClick={handleLogout}
          >
            {currentUser.role === "admin" ? "Logout" : "Switch Role"}
          </button>
        </div>
      </header>

      {/* Conditional Rendering of Dashboards */}
      <main>
        {activeTab === "user" ? (
          <UserPortal />
        ) : (
          <AdminPortal onIngestComplete={handleIngestComplete} />
        )}
      </main>
    </div>
  );
}

export default App;
