import React, { useState, useRef, useEffect } from "react";

export default function AdminPortal({ onIngestComplete }) {
  const [jobs, setJobs] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const completedJobsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Fetch job list from the backend Express server
  const fetchJobs = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/jobs");
      if (response.ok) {
        const serverJobs = await response.json();
        
        setJobs(prev => {
          // Find any local temporary jobs that are still uploading (ID starts with "temp-")
          const activeTemps = prev.filter(j => j.id.toString().startsWith("temp-"));
          
          // Filter out local temp jobs that the server is now actively reporting
          const unresolvedTemps = activeTemps.filter(temp => {
            return !serverJobs.some(sJob => sJob.filename === temp.filename);
          });
          
          // Combine server jobs with unresolved local temp jobs
          return [...unresolvedTemps, ...serverJobs];
        });
        
        // Check if any job completed and notify App component
        serverJobs.forEach(job => {
          if (job.status === "completed") {
            if (isFirstLoadRef.current) {
              // Silence completed notify on initial mount
              completedJobsRef.current.add(job.id);
            } else if (!completedJobsRef.current.has(job.id)) {
              // Trigger notification exactly once when it transitions to completed
              completedJobsRef.current.add(job.id);
              onIngestComplete(job.filename);
            }
          }
        });
        
        isFirstLoadRef.current = false;
      }
    } catch (error) {
      console.error("Error fetching jobs from server:", error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchJobs();
  }, []);

  // Poll for jobs progress while any job is in processing status
  useEffect(() => {
    const hasActiveJobs = jobs.some(j => j.status === "processing" || j.status === "queued");
    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs]);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  // Handle file input selection
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  // Upload file to the live backend Express endpoint
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("video", file);

    // Add local temporary job state
    const tempJobId = "temp-" + Date.now();
    const tempJob = {
      id: tempJobId,
      filename: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "processing",
      progress: 5,
      step: "Uploading file to server..."
    };

    setJobs(prev => [tempJob, ...prev]);

    try {
      const response = await fetch("http://localhost:5000/api/admin/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const backendJob = await response.json();
      
      // Replace temporary job with the backend job definition
      setJobs(prev => prev.map(job => job.id === tempJobId ? backendJob : job));
      
      // Trigger a poll check
      fetchJobs();

    } catch (error) {
      console.error("Upload error:", error);
      setJobs(prev => prev.map(job => 
        job.id === tempJobId 
          ? { ...job, status: "failed", step: `Upload failed: ${error.message}`, progress: 0 }
          : job
      ));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="admin-layout">
      {/* Left side: Uploader */}
      <div className="card">
        <h2 className="card-title">Upload Video Lecture</h2>
        <div
          className={`upload-zone ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="file-input"
            accept="video/*"
            onChange={handleFileInput}
          />
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <h3>Drag & Drop video file here</h3>
            <p>or click to browse files from your computer</p>
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "10px" }}>
              Accepts .mp4, .mkv, .avi format lectures
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Active Jobs & Database status */}
      <div className="card">
        <h2 className="card-title">Video Ingestion Queue</h2>
        <div style={{ overflowX: "auto" }}>
          {jobs.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#64748b", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>
              No ingestion tasks found. Upload a video to populate this list.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lecture Name</th>
                  <th>Size</th>
                  <th>Status / Progress</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontWeight: 500, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {job.filename}
                    </td>
                    <td>{job.size}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className={`status-badge ${job.status}`}>
                          {job.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {job.step} ({job.progress}%)
                        </span>
                        {job.status === "processing" && (
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${job.progress}%` }}></div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
