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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_pass_test"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def test_visitor_pass():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9244",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1520,1150",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9244/json").read().decode()
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

            # Wait for table rows to load
            for i in range(20):
                check_res = await send_cmd("Runtime.evaluate", {
                    "expression": "document.querySelectorAll('.clickable-visitor-row').length",
                    "returnByValue": True
                })
                count = check_res.get("result", {}).get("value", 0)
                if count > 0:
                    print(f"Found {count} visitor rows on attempt {i+1}!")
                    break
                await asyncio.sleep(1.0)

            # Capture dashboard view
            dash_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            dash_path = os.path.join(ARTIFACT_DIR, "dashboard_today_visitors.png")
            with open(dash_path, "wb") as f:
                f.write(base64.b64decode(dash_screen["data"]))
            print("Saved dashboard screenshot:", dash_path)

            # Click on the first row or the Pass & Checkout button
            click_js = """
                const btn = document.querySelector('.pass-row-open-btn');
                if (btn) {
                    btn.click();
                    'clicked_btn';
                } else {
                    const row = document.querySelector('.clickable-visitor-row');
                    if (row) {
                        row.click();
                        'clicked_row';
                    } else {
                        'no_row';
                    }
                }
            """
            click_res = await send_cmd("Runtime.evaluate", {"expression": click_js, "returnByValue": True})
            print("Click result:", click_res)

            # Wait for the visitor pass page to load
            for i in range(20):
                check_res = await send_cmd("Runtime.evaluate", {
                    "expression": "Boolean(document.querySelector('.vms-pass-card'))",
                    "returnByValue": True
                })
                has_pass = check_res.get("result", {}).get("value", False)
                if has_pass:
                    print(f"Visitor pass card rendered on attempt {i+1}!")
                    break
                await asyncio.sleep(1.0)

            await asyncio.sleep(1.5)

            # Capture the new Visitor Pass & Departure page
            pass_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            pass_path = os.path.join(ARTIFACT_DIR, "visitor_pass_detail_page.png")
            with open(pass_path, "wb") as f:
                f.write(base64.b64decode(pass_screen["data"]))
            print("Saved pass detail screenshot:", pass_path)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_visitor_pass())
