# Converts the videos to mp3 
import os 
import subprocess

files = os.listdir("Videos") 
for file in files: 
    # print(file)
    if " - " in file and " #" in file:
        file_name = file.split(" - ")[0]
        tutorial_number = file.split("-")[1].split(" #")[1].split(".")[0]
    else:
        file_name = file.rsplit(".", 1)[0]
        tutorial_number = "0"
        
    print(tutorial_number, file_name)
    subprocess.run(["ffmpeg", "-i", f"Videos/{file}", f"audios/{tutorial_number}_{file_name}.mp3"])

    # this "-i" means next argument will be input
    # all videos now converted into audios(mp3s)

    