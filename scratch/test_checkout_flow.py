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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_pass_test2"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def test_checkout():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9245",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1520,1150",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9245/json").read().decode()
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

            # Inject auth & override window.confirm
            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(3.5)

            # Wait for table rows to load
            for i in range(15):
                check_res = await send_cmd("Runtime.evaluate", {
                    "expression": "document.querySelectorAll('.clickable-visitor-row').length",
                    "returnByValue": True
                })
                count = check_res.get("result", {}).get("value", 0)
                if count > 0:
                    print(f"Found {count} rows")
                    break
                await asyncio.sleep(1.0)

            # Click row to open pass page
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.pass-row-open-btn').click();"
            })

            # Wait for pass page to load
            for i in range(15):
                check_res = await send_cmd("Runtime.evaluate", {
                    "expression": "Boolean(document.querySelector('.vms-checkout-direct-btn'))",
                    "returnByValue": True
                })
                if check_res.get("result", {}).get("value", False):
                    print("Checkout button ready on pass page!")
                    break
                await asyncio.sleep(1.0)

            # Accept window.confirm automatically
            await send_cmd("Runtime.evaluate", {
                "expression": "window.confirm = () => true;"
            })

            # Click Check Out Visitor Directly
            co_res = await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.vms-checkout-direct-btn').click(); 'checkout_clicked';",
                "returnByValue": True
            })
            print("Checkout action triggered:", co_res)

            await asyncio.sleep(3.0)

            # Capture post-checkout state
            pass_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            pass_path = os.path.join(ARTIFACT_DIR, "checked_out_direct_result.png")
            with open(pass_path, "wb") as f:
                f.write(base64.b64decode(pass_screen["data"]))
            print("Saved post-checkout screenshot:", pass_path)

            # Click Back to Dashboard
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.it-qr-portal-btn').click();"
            })
            await asyncio.sleep(2.5)

            # Capture updated dashboard
            dash_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            dash_path = os.path.join(ARTIFACT_DIR, "dashboard_after_direct_checkout.png")
            with open(dash_path, "wb") as f:
                f.write(base64.b64decode(dash_screen["data"]))
            print("Saved dashboard after checkout screenshot:", dash_path)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_checkout())
