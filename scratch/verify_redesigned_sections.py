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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_verify_sections_2"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def verify():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9254",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1400,920",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9254/json").read().decode()
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

            # 1. Inject auth and reload to start on Dashboard
            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(4.0)

            # Capture Dashboard
            screen_dash = await send_cmd("Page.captureScreenshot", {"format": "png"})
            path_dash = os.path.join(ARTIFACT_DIR, "dashboard_redesigned.png")
            with open(path_dash, "wb") as f:
                f.write(base64.b64decode(screen_dash["data"]))
            print("Saved dashboard_redesigned")

            # 2. Click "IT Pre-Approvals"
            await send_cmd("Runtime.evaluate", {
                "expression": "Array.from(document.querySelectorAll('.sidebar-item')).find(b => b.textContent.includes('IT Pre-Approvals'))?.click();"
            })
            await asyncio.sleep(3.0)

            # Capture IT Pre-Approvals
            screen_it = await send_cmd("Page.captureScreenshot", {"format": "png"})
            path_it = os.path.join(ARTIFACT_DIR, "it_preapprovals_redesigned.png")
            with open(path_it, "wb") as f:
                f.write(base64.b64decode(screen_it["data"]))
            print("Saved it_preapprovals_redesigned")

            # 3. Click "General Pre-Approvals"
            await send_cmd("Runtime.evaluate", {
                "expression": "Array.from(document.querySelectorAll('.sidebar-item')).find(b => b.textContent.includes('General Pre-Approvals'))?.click();"
            })
            await asyncio.sleep(3.0)

            # Capture General Pre-Approvals
            screen_gen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            path_gen = os.path.join(ARTIFACT_DIR, "general_preapprovals_redesigned.png")
            with open(path_gen, "wb") as f:
                f.write(base64.b64decode(screen_gen["data"]))
            print("Saved general_preapprovals_redesigned")

            # 4. Click "Visitors"
            await send_cmd("Runtime.evaluate", {
                "expression": "Array.from(document.querySelectorAll('.sidebar-item')).find(b => b.textContent.trim() === 'Visitors')?.click();"
            })
            await asyncio.sleep(3.0)

            # Capture Visitors
            screen_vis = await send_cmd("Page.captureScreenshot", {"format": "png"})
            path_vis = os.path.join(ARTIFACT_DIR, "visitors_directory_redesigned.png")
            with open(path_vis, "wb") as f:
                f.write(base64.b64decode(screen_vis["data"]))
            print("Saved visitors_directory_redesigned")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(verify())
