from pathlib import Path
import os
import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
KEY = 'async-images/q8ob91gNkG1w3cV2UUjL5A/image-4.webp'
response = requests.get(
    os.environ['MANUS_API_URL'].rstrip('/') + '/v1/storage/presign/get',
    params={'path': KEY},
    headers={'Authorization': 'Bearer ' + os.environ['MANUS_API_KEY']},
    timeout=30,
)
response.raise_for_status()
result = response.json()
if not result.get('url'):
    raise RuntimeError('Storage did not return an asset download URL.')
asset = requests.get(result['url'], timeout=60)
asset.raise_for_status()
path = ROOT / 'client/public/assets/app-icon.webp'
path.write_bytes(asset.content)
image = Image.open(path)
image.load()
if image.width < 512 or image.height < 512:
    raise RuntimeError('The downloaded asset is too small for the requested PWA icon.')
print(f'Generated icon obtained: {image.width}x{image.height}, {len(asset.content)} bytes')
if image.width != image.height:
    raise RuntimeError('Expected a square app icon; refusing to distort or crop it.')
icons = ROOT / 'client/public/icons'
icons.mkdir(parents=True, exist_ok=True)
for name, size in [('icon-192.png', 192), ('icon-512.png', 512), ('icon-maskable.png', 512), ('apple-touch-icon.png', 180)]:
    image.convert('RGBA').resize((size, size), Image.Resampling.LANCZOS).save(icons / name)
    print(f'Prepared {name} ({size}x{size})')
