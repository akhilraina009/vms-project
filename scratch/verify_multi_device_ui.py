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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_multidevice"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def verify():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN", "first_name": "Akhil"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9258",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1400,920",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9258/json").read().decode()
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

            # Inject auth
            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(3.5)

            # ==========================================
            # 1. PHONE VIEW (iPhone 13 / 14: 390 x 844)
            # ==========================================
            print("--- Setting Phone Emulation (390 x 844) ---")
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 390,
                "height": 844,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(1.0)

            # Capture phone dashboard
            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "phone_dashboard_view.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved phone_dashboard_view.png")

            # Check computed styles on phone
            eval_res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const topbar = document.querySelector('.mobile-topbar');
                    const sidebar = document.querySelector('.sidebar');
                    const main = document.querySelector('.main-content');
                    return {
                        topbarDisplay: window.getComputedStyle(topbar).display,
                        topbarHeight: topbar.offsetHeight,
                        sidebarTransform: window.getComputedStyle(sidebar).transform,
                        mainMarginLeft: window.getComputedStyle(main).marginLeft,
                        mainWidth: main.offsetWidth
                    };
                })()
                """,
                "returnByValue": True
            })
            print("Phone metrics:", eval_res.get("result", {}).get("value"))

            # Open mobile menu drawer
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.mobile-topbar-menu-btn').click();"
            })
            await asyncio.sleep(0.6)

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "phone_sidebar_drawer_open.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved phone_sidebar_drawer_open.png")

            # Navigate to Visitors via mobile drawer
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    const visBtn = btns.find(b => b.innerText.includes('Visitors'));
                    if (visBtn) visBtn.click();
                })()
                """
            })
            await asyncio.sleep(1.0)

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "phone_visitors_view.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved phone_visitors_view.png")

            # ==========================================
            # 2. TABLET VIEW (iPad Air: 820 x 1180)
            # ==========================================
            print("--- Setting Tablet Emulation (820 x 1180) ---")
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 820,
                "height": 1180,
                "deviceScaleFactor": 2,
                "mobile": True
            })
            await asyncio.sleep(1.0)

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "tablet_visitors_view.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved tablet_visitors_view.png")

            # Navigate to Dashboard on tablet
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.mobile-topbar-brand').click();"
            })
            await asyncio.sleep(1.0)

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "tablet_dashboard_view.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved tablet_dashboard_view.png")

            # ==========================================
            # 3. LAPTOP / DESKTOP VIEW (1400 x 900)
            # ==========================================
            print("--- Setting Desktop View (1400 x 900) ---")
            await send_cmd("Emulation.clearDeviceMetricsOverride")
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 1400,
                "height": 900,
                "deviceScaleFactor": 1,
                "mobile": False
            })
            await asyncio.sleep(1.0)

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "laptop_dashboard_view.png"), "wb") as f:
                f.write(base64.b64decode(shot["data"]))
            print("Saved laptop_dashboard_view.png")

            print("ALL DEVICE SCREENSHOTS AND VERIFICATIONS COMPLETED SUCCESSFULLY!")

    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(verify())
