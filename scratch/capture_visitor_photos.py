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
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_photo_verify"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def capture_all_photos():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9246",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1520,1150",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9246/json").read().decode()
        targets = json.loads(targets_res)
        page_target = next(t for t in targets if t.get("type") == "page")
        ws_url = page_target["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            msg_id = 1
            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                payload = {"id": cid, "method": method}
                if params:
                    payload["params"] = params
                await ws.send(json.dumps(payload))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == cid:
                        return resp.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")

            # 1. Inject auth
            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(4.0)

            # Capture 1: Dashboard with photos
            dash_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            dash_path = os.path.join(ARTIFACT_DIR, "dashboard_with_photos.png")
            with open(dash_path, "wb") as f:
                f.write(base64.b64decode(dash_screen["data"]))
            print("Saved dashboard_with_photos:", dash_path)

            # 2. Click Checkout tab in sidebar
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelectorAll('.sidebar-item')[3].click();"
            })
            await asyncio.sleep(3.0)

            # Capture 2: Checkout Currently Inside with photos
            co_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            co_path = os.path.join(ARTIFACT_DIR, "checkout_table_with_photos.png")
            with open(co_path, "wb") as f:
                f.write(base64.b64decode(co_screen["data"]))
            print("Saved checkout_table_with_photos:", co_path)

            # 3. Go back to Dashboard and open pass detail
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelectorAll('.sidebar-item')[0].click();"
            })
            await asyncio.sleep(2.0)

            # Click on first visitor row to open Pass page
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.pass-row-open-btn').click();"
            })
            await asyncio.sleep(3.0)

            # Capture 3: Visitor pass with photo
            pass_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            pass_path = os.path.join(ARTIFACT_DIR, "pass_detail_with_photo.png")
            with open(pass_path, "wb") as f:
                f.write(base64.b64decode(pass_screen["data"]))
            print("Saved pass_detail_with_photo:", pass_path)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(capture_all_photos())
