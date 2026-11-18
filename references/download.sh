#!/bin/sh
# Re-runnable: archive.txt skips reels already downloaded. Logged-out, so slow and polite.
cd "$(dirname "$0")"
sed 's|^|https://www.instagram.com/reel/|; s|$|/|' reel_ids.txt > urls.txt
/c/VOLUME_D/Ideas/davinci-resolve-mcp/venv/Scripts/python.exe -m yt_dlp -a urls.txt \
  -o "videos/%(upload_date)s_%(id)s.%(ext)s" --write-info-json --no-write-comments \
  --download-archive archive.txt --ignore-errors --no-overwrites \
  --sleep-requests 2 --sleep-interval 3 --max-sleep-interval 7 -f "b[ext=mp4]/b"
