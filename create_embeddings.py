import requests
import os
import json
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import joblib


def create_embedding(text_list):
    # https://github.com/ollama/ollama/blob/main/docs/api.md#generate-embeddings
    r = requests.post("http://localhost:11434/api/embed", json={
        "model": "nomic-embed-text", #bgme-3 is not working ollama internal problems.
        "input": text_list
    })

    # embedding = r.json()["embeddings"]
    data = r.json()

    if "embeddings" not in data:
        raise RuntimeError(f"Ollama error: {data}")

    return data["embeddings"] 
    # return embedding
    # returns a list

jsons = os.listdir("jsons")  # List all the jsons 
my_dicts = []
chunk_id = 0

for json_file in jsons:
    with open(f"jsons/{json_file}") as f:
        content = json.load(f)
    print(f"Creating Embeddings for {json_file}")
    embeddings = create_embedding([c['text'] for c in content['chunks']])
    start=[c['start'] for c in content['chunks']]
    end=[c['end'] for c in content['chunks']]



    for i, chunk in enumerate(content['chunks']):
        chunk['chunk_id'] = chunk_id
        chunk['embedding'] = embeddings[i]
        chunk['start'] = start[i]
        chunk['end'] = end[i]
        chunk_id += 1
        my_dicts.append(chunk) 
    
# break as to checking only for 1 json file


df = pd.DataFrame.from_records(my_dicts)
joblib.dump(df, 'embeddings.joblib')
# print(df)
