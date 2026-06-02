import json
import os
import math

n=5
for file in os.listdir('jsons'):
    file_path=os.path.join('jsons',file) 

    '''
    this gives path of files like this jsons/a.json
    if we directly open file then python cant detect as there is no a.json file in this folder it it inside json so necessary to give whole path.
    '''
    with open(file_path,'r',encoding='utf-8') as f:
        data=json.load(f)
        new_chunks=[]
        chunks_len=len(data['chunks'])
        nOfchunks=math.ceil(chunks_len/n)

        for i in range (nOfchunks):
            strt_tym=data['chunks'][i*n]['start']
            end_idx=min(chunks_len,(i+1)*n)
            end_tym=data['chunks'][end_idx-1]['end']
            new_chunks.append({
                "number":data['chunks'][0]['number'],
                "title":data['chunks'][0]['title'],
                "start":strt_tym,
                "end":end_tym,
                "text":" ".join(c['text'] for c in data['chunks'][i*n:end_idx])
            })
        os.makedirs("new_jsons",exist_ok='true')
        with open(os.path.join('new_jsons',file),'w', encoding="utf-8") as json_file:
            json.dump({"chunks": new_chunks, "text":data['text']},json_file)


