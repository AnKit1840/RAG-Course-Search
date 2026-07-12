// Format seconds into MM:SS
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export const mockChunks = [];

// Queries the live Node.js Express backend RAG Search API
export async function searchRAG(query) {
  if (!query || query.trim() === "") {
    return {
      answer: "Please ask a question related to your video course playlist.",
      sources: []
    };
  }

  try {
    const response = await fetch("http://localhost:5000/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${response.status}`);
    }

    return await response.json(); // Expects { answer, sources: [...] }
  } catch (error) {
    console.error("Search API failure:", error);
    return {
      answer: `⚠️ Connection Error: Failed to reach the backend server.\n\nMake sure the Express server is running on port 5000. (Details: ${error.message})`,
      sources: []
    };
  }
}
