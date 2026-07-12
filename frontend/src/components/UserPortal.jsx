import React, { useState } from "react";
import { searchRAG, formatTime } from "../services/MockData";

export default function UserPortal({ database }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Parse synthesized response text and highlight timestamps
  const renderResponseText = (text) => {
    if (!text) return "";
    
    // Regex to match timestamp formats: **MM:SS** or **M:SS**
    const parts = text.split(/(\*\*\d{1,2}:\d{2}\*\*)/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\*\*(\d{1,2}):(\d{2})\*\*/);
      if (match) {
        return (
          <span
            key={index}
            className="timestamp-badge"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "600",
              fontSize: "13px",
              margin: "0 4px",
              display: "inline-block"
            }}
            title={`Starts at ${part.replace(/\*\*/g, "")}`}
          >
            ⏱️ {part.replace(/\*\*/g, "")}
          </span>
        );
      }
      return part;
    });
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    // Set a loading indicator or state while fetching
    setAnswer("Thinking...");
    setSources([]);
    setHasSearched(true);

    const result = await searchRAG(query);
    setAnswer(result.answer);
    setSources(result.sources || []);
  };

  return (
    <div className="search-portal-container">
      <div className="card">
        <h2 className="card-title" style={{ borderBottom: "none", marginBottom: 0 }}>
          Search Course Dashboard
        </h2>
        <p style={{ margin: "5px 0 20px 0", fontSize: "14px", color: "#64748b" }}>
          Ask questions to find specific topics and timestamps instantly.
        </p>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Ask anything (e.g., 'how to install vs code', 'what is padding and margin', 'seo')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>

        {/* Quick links to help user search */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Try asking:</span>
          <button type="button" className="btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => { setQuery("how to install VS Code"); setTimeout(handleSearch, 50); }}>
            VS Code installation
          </button>
          <button type="button" className="btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => { setQuery("what is margin and padding"); setTimeout(handleSearch, 50); }}>
            Margin & Padding
          </button>
          <button type="button" className="btn-secondary" style={{ padding: "4px 8px", fontSize: "12px" }} onClick={() => { setQuery("core web vitals and seo"); setTimeout(handleSearch, 50); }}>
            SEO & Web Vitals
          </button>
        </div>
      </div>

      {/* Answer section */}
      {hasSearched && (
        <div className="card">
          <h3 className="card-title">Assistant Response</h3>
          <div className="answer-box">
            <div className="answer-header">
              <span>🤖</span> AI Synthesis Response
            </div>
            <div className="answer-body">
              {renderResponseText(answer)}
            </div>
          </div>

          {/* Source Matches */}
          <h4 style={{ margin: "20px 0 10px 0", fontSize: "15px", fontWeight: "600" }}>
            References from Lectures ({sources.length})
          </h4>
          {sources.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#64748b", fontStyle: "italic" }}>
              No video references found for this search.
            </p>
          ) : (
            <div className="results-list">
              {sources.map((src) => {
                return (
                  <div
                    key={src.chunk_id}
                    className="result-card"
                    style={{ cursor: "default" }}
                  >
                    <div className="result-card-header">
                      <span className="result-video-title">
                        Lec {src.number}: {src.title}
                      </span>
                      <span className="result-badge" style={{ backgroundColor: "#f1f5f9" }}>
                        ⏱️ Starts at {formatTime(src.start)} (Duration: {formatTime(src.end - src.start)})
                      </span>
                    </div>
                    <p className="result-text">"{src.text}"</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
