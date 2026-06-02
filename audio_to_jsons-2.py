import whisper
import json
import os

model = whisper.load_model("large-v2")

audios = os.listdir("audios")

for audio in audios: 
    if "_" in audio:
        number = audio.split("_")[0]
        title = audio.split("_")[1].rsplit(".", 1)[0]
    else:
        number = "0"
        title = audio.rsplit(".", 1)[0]
        
    print(number, title)
    result = model.transcribe(audio = f"audios/{audio}", 
                          language="hi",
                          task="translate",
                          word_timestamps=False )
    # transcription means converting spoken audio into written text.
    
    chunks = []
    # Faced Quite a problem in formation of chunks
    for segment in result["segments"]:
        chunks.append({"number": number, "title":title, "start": segment["start"], "end": segment["end"], "text": segment["text"]})
    
    chunks_with_metadata = {"chunks": chunks, "text": result["text"]}
    # Storing Overall Text as well with all chunks in form of dictionary

    with open(f"jsons/{audio}.json", "w") as f:
        json.dump(chunks_with_metadata,f)

    # dumping every dictionary formed in json file.
        
    #we can also decide size of chunks according to time like size of chunks is min 15sec.
            
"""
MIN_DURATION = 15.0

chunks = []
current_text = []
chunk_start = None

for seg in segments:
    if chunk_start is None:
        chunk_start = seg["start"]

    current_text.append(seg["text"])

    duration = seg["end"] - chunk_start

    if duration >= MIN_DURATION:
        chunks.append({
            "text": " ".join(current_text),
            "start": chunk_start,
            "end": seg["end"]
        })
        current_text = []
        chunk_start = None   
"""