import os
import sys
import json
import subprocess
import math
import requests
import whisper

def clean_filename(name):
    # Remove any characters illegal in Windows filenames: \ / : * ? " < > |
    return "".join(c for c in name if c not in '\\/:*?"<>|')

def main():
    if len(sys.argv) < 2:
        print("Usage: python ingest_single.py <video_filename>")
        sys.exit(1)

    video_file = sys.argv[1]
    video_path = os.path.join("Videos", video_file)

    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)

    # 1. Parse number and title
    if " - " in video_file and " #" in video_file:
        file_name = video_file.split(" - ")[0]
        tutorial_number = video_file.split("-")[1].split(" #")[1].split(".")[0]
    else:
        file_name = video_file.rsplit(".", 1)[0]
        tutorial_number = "0"

    print(f"PROGRESS:10:Parsed filename. Lecture: {tutorial_number}, Title: {file_name}")

    # Ensure directories exist
    os.makedirs("audios", exist_ok=True)
    os.makedirs("jsons", exist_ok=True)

    audio_name = f"{tutorial_number}_{file_name}"
    audio_path = os.path.join("audios", f"{audio_name}.mp3")

    # 2. Audio Extraction
    print("PROGRESS:20:Extracting audio track from video...")
    try:
        subprocess.run([
            "ffmpeg", "-y",
            "-i", video_path,
            audio_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError as e:
        print(f"Error: FFmpeg extraction failed: {e}")
        sys.exit(1)

    # 3. Whisper Speech Recognition & Translation
    print("PROGRESS:40:Transcribing audio and translating to English (Whisper small)...")
    try:
        # Load whisper model
        model = whisper.load_model("small")
        result = model.transcribe(
            audio=audio_path,
            language="hi",
            task="translate",
            word_timestamps=False
        )
    except Exception as e:
        print(f"Error: Whisper transcription failed: {e}")
        sys.exit(1)

    # 4. Context Chunking (ensure each chunk is at least 15 seconds long)
    print("PROGRESS:70:Merging transcript chunks for semantic context...")
    segments = result.get("segments", [])
    
    MIN_DURATION = 15.0
    merged_chunks = []
    current_text = []
    chunk_start = None

    for seg in segments:
        if chunk_start is None:
            chunk_start = seg["start"]

        current_text.append(seg["text"])
        duration = seg["end"] - chunk_start

        if duration >= MIN_DURATION:
            merged_chunks.append({
                "number": tutorial_number,
                "title": file_name,
                "start": chunk_start,
                "end": seg["end"],
                "text": " ".join(current_text)
            })
            current_text = []
            chunk_start = None

    # Handle any trailing segments
    if current_text and chunk_start is not None:
        merged_chunks.append({
            "number": tutorial_number,
            "title": file_name,
            "start": chunk_start,
            "end": segments[-1]["end"] if segments else chunk_start + 5.0,
            "text": " ".join(current_text)
        })

    # Save transcription file statically
    with open(f"jsons/{audio_name}.mp3.json", "w", encoding="utf-8") as f:
        json.dump({"chunks": merged_chunks, "text": result.get("text", "")}, f, indent=2)

    # 5. Embed Chunks using local Ollama nomic-embed-text
    print("PROGRESS:85:Generating vector embeddings via Ollama...")
    try:
        embed_texts = [c["text"] for c in merged_chunks]
        r = requests.post("http://localhost:11434/api/embed", json={
            "model": "nomic-embed-text",
            "input": embed_texts
        })
        embeddings = r.json().get("embeddings")
        if not embeddings:
            raise RuntimeError(f"Ollama response error: {r.text}")
    except Exception as e:
        print(f"Error: Embedding generation failed: {e}")
        sys.exit(1)

    # Compile chunks list with embeddings
    final_records = []
    for i, chunk in enumerate(merged_chunks):
        chunk["embedding"] = embeddings[i]
        final_records.append(chunk)

    # Standardized output path inside embeddings/ directory
    os.makedirs("embeddings", exist_ok=True)
    formatted_name = f"{str(tutorial_number).zfill(2)}_{file_name}"
    clean_name = clean_filename(formatted_name) + ".json"
    dest_path = os.path.join("embeddings", clean_name)

    print("PROGRESS:95:Saving video embeddings file...")
    try:
        with open(dest_path, "w", encoding="utf-8") as f:
            json.dump(final_records, f, indent=2)
    except Exception as e:
        print(f"Error: Writing embeddings failed: {e}")
        sys.exit(1)

    print("PROGRESS:100:Finished!")

if __name__ == "__main__":
    main()
