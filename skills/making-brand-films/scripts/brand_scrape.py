"""Brand intake from a website's own source: fonts, colour frequency, and (Shopify) product images.
usage: python brand_scrape.py https://brand.com [--products]
Prints font families + @font-face files, the most frequent hex colours (noise from widgets included: confirm against posts),
and with --products the Shopify catalogue (handle | title | first image URL).
"""
import collections, json, re, subprocess, sys, urllib.error, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "text/html,application/json,text/css,*/*", "Accept-Language": "en-US,en;q=0.9"}


def get(url):
    try:
        return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read().decode("utf8", "ignore")
    except urllib.error.HTTPError as e:  # Shopify answers urllib with 429/403 but serves curl
        if e.code not in (403, 429): raise
        return subprocess.run(["curl", "-sL", "-A", UA["User-Agent"], url], capture_output=True, check=True).stdout.decode("utf8", "ignore")


def main(site, products):
    site = site.rstrip("/")
    html = get(site)
    css_links = re.findall(r'href="([^"]+\.css[^"]*)"', html)
    css = html
    for href in css_links[:6]:  # the theme's own stylesheets often hold the type and colour tokens
        url = href if href.startswith("http") else ("https:" + href if href.startswith("//") else site + "/" + href.lstrip("/"))
        try: css += get(url)
        except Exception as e: print("  (skip css", url[:80], e, ")")
    fam = collections.Counter(m.strip(" '\"") for m in re.findall(r"font-family:\s*([^;}\"!,]+)", css))
    print("== fonts (by frequency)")
    for f, n in fam.most_common(12): print(f"  {n:4} {f}")
    print("== @font-face files")
    for m in re.finditer(r"@font-face\s*\{(.{0,400}?)\}", css, re.S):
        blk = m.group(1)
        f = re.search(r"font-family:\s*['\"]?([^;'\"]+)", blk); u = re.search(r"url\(['\"]?([^)'\"]+)", blk)
        if f and u: print(f"  {f.group(1):24} {u.group(1).split('?')[0][-70:]}")
    hexes = collections.Counter(h.lower() for h in re.findall(r"#[0-9a-fA-F]{6}\b", css))
    print("== hex colours (by frequency)")
    print("  " + "  ".join(f"{h}:{n}" for h, n in hexes.most_common(20)))
    if products:
        try:
            data = json.loads(get(site + "/products.json?limit=250"))
        except Exception as e:
            print("== no Shopify products.json:", e); return
        print(f"== products ({len(data['products'])})")
        for p in data["products"]:
            img = p["images"][0]["src"].split("?")[0] if p["images"] else ""
            print(f"  {p['handle']} | {p['title'][:40]} | {len(p['images'])} imgs | {img}")


if __name__ == "__main__":
    main(sys.argv[1], "--products" in sys.argv)
