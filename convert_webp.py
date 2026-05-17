import os
from PIL import Image

def convert_images(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".png"):
            png_path = os.path.join(directory, filename)
            webp_path = os.path.join(directory, os.path.splitext(filename)[0] + ".webp")
            
            with Image.open(png_path) as img:
                # Use a quality of 80 for a good balance of size and quality
                img.save(webp_path, "WEBP", quality=80)
            print(f"Converted {filename} to WebP")

# Convert Studio assets
convert_images("E:/Unreal Projects/LelitDistrikt2/CPS-Website/src/assets/studio")

# Convert root assets
convert_images("E:/Unreal Projects/LelitDistrikt2/CPS-Website/src/assets")

# Also convert public assets if needed (large ones like lelit-bg.png)
convert_images("E:/Unreal Projects/LelitDistrikt2/CPS-Website/public")
