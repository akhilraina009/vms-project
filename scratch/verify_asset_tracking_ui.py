import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64
import os
import sys

backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_verify_asset_tracking"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def verify():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9260",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1400,920",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9260/json").read().decode()
        targets = json.loads(targets_res)
        page_target = next(t for t in targets if t.get("type") == "page")
        ws_url = page_target["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            mid = 1
            async def send_cmd(method, params=None):
                nonlocal mid; mid += 1
                payload = {"id": mid, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == mid:
                        return resp.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")

            # 1. Inject auth and reload to start
            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(4.0)

            # 2. Click "Asset Recovery & Tracking"
            nav_js = """
                Array.from(document.querySelectorAll('.sidebar-item')).find(b => b.textContent.includes('Asset Recovery & Tracking'))?.click();
            """
            await send_cmd("Runtime.evaluate", {"expression": nav_js})
            await asyncio.sleep(3.0)

            # Capture Asset Recovery & Tracking
            screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            path = os.path.join(ARTIFACT_DIR, "asset_recovery_redesigned_font.png")
            with open(path, "wb") as f:
                f.write(base64.b64decode(screen["data"]))
            print("Saved asset_recovery_redesigned_font:", path)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(verify())
