import { useState } from "react";
import UserPortal from "./components/UserPortal";
import AdminPortal from "./components/AdminPortal";
import LoginPortal from "./components/LoginPortal";
import { mockChunks } from "./services/MockData";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { name, role }
  const [activeTab, setActiveTab] = useState("user"); // "user" or "admin"
  const [database, setDatabase] = useState(mockChunks);
  const [notification, setNotification] = useState("");

  const handleLogin = (role, username) => {
    setCurrentUser({ name: username, role: role });
    setActiveTab(role);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleIngestComplete = (filename) => {
    // Extract number and title from filename
    let number = "0";
    let title = filename;

    if (filename.includes(" - ") && filename.includes(" #")) {
      title = filename.split(" - ")[0];
      number = filename.split("-")[1].split(" #")[1].split(".")[0];
    } else if (filename.includes("_")) {
      number = filename.split("_")[0];
      title = filename.split("_")[1].replace(/\.[^/.]+$/, "");
    } else {
      // Clean extension
      title = filename.replace(/\.[^/.]+$/, "");
    }

    // Generate new mock chunks based on name
    const newChunks = [
      {
        id: Date.now() + 1,
        number: number,
        title: title,
        start: 10.5,
        end: 45.0,
        text: `In this lecture on ${title}, we introduce the core concepts of the topic. The instructor explains the prerequisites and maps out the goals.`
      },
      {
        id: Date.now() + 2,
        number: number,
        title: title,
        start: 75.0,
        end: 150.0,
        text: `Here we look at the main setup and practical syntax code for ${title}. Pay close attention to the structural properties and configurations.`
      },
      {
        id: Date.now() + 3,
        number: number,
        title: title,
        start: 220.0,
        end: 310.0,
        text: `Finally, we solve exercises related to ${title} and test our understanding by writing real-world styles and scripts.`
      }
    ];

    // Append to local database state and MockData search chunks
    setDatabase((prev) => [...prev, ...newChunks]);
    mockChunks.push(...newChunks);

    // Show custom flash banner
    setNotification(`Successfully processed "${filename}"! Extracted 3 semantic text chunks & synchronized vector search index.`);
    setTimeout(() => {
      setNotification("");
    }, 5000);
  };

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
              {currentUser.name}
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
            Switch Role / Logout
          </button>
        </div>
      </header>

      {/* Conditional Rendering of Dashboards */}
      <main>
        {activeTab === "user" ? (
          <UserPortal database={database} />
        ) : (
          <AdminPortal onIngestComplete={handleIngestComplete} />
        )}
      </main>
    </div>
  );
}

export default App;
