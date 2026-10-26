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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_verify_symmetry"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def test_symmetry():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN", "first_name": "Akhil"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9261",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=620,950",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9261/json").read().decode()
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

            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(3.0)

            # Navigate to Pre-Approvals
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    const pBtn = btns.find(b => b.innerText.includes('Pre-Approvals'));
                    if (pBtn) pBtn.click();
                })()
                """
            })
            await asyncio.sleep(1.5)

            # 1. Capture Medium / Sized Window View (exactly matching user's Image 1)
            shot1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "preapprovals_symmetrical_aligned.png"), "wb") as f:
                f.write(base64.b64decode(shot1["data"]))
            print("Saved preapprovals_symmetrical_aligned.png")

            # 2. Open Mobile Drawer and capture (matching user's Image 4)
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.mobile-topbar-menu-btn').click();"
            })
            await asyncio.sleep(0.6)
            shot2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "sidebar_drawer_symmetrical_aligned.png"), "wb") as f:
                f.write(base64.b64decode(shot2["data"]))
            print("Saved sidebar_drawer_symmetrical_aligned.png")

            # Close drawer
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.sidebar-mobile-close-btn').click();"
            })
            await asyncio.sleep(0.5)

            # 3. Desktop 1400px View
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1400,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(1.0)
            shot3 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "preapprovals_desktop_symmetrical.png"), "wb") as f:
                f.write(base64.b64decode(shot3["data"]))
            print("Saved preapprovals_desktop_symmetrical.png")

    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(test_symmetry())
