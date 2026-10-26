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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_verify_inputs"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def verify():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9248",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1400,920",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9248/json").read().decode()
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

            # 1. Clear any local storage so we are on Login page
            clear_js = """
                localStorage.clear();
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": clear_js})
            await asyncio.sleep(3.0)

            # Focus on email input and type text
            type_login_js = """
                const emailInput = document.querySelector('input[type="email"]');
                if (emailInput) {
                    emailInput.focus();
                    emailInput.value = 'admin@enterprise.vms';
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            """
            await send_cmd("Runtime.evaluate", {"expression": type_login_js})
            await asyncio.sleep(0.5)

            # Capture Login page with active typing input
            login_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            login_path = os.path.join(ARTIFACT_DIR, "login_redesigned_inputs.png")
            with open(login_path, "wb") as f:
                f.write(base64.b64decode(login_screen["data"]))
            print("Saved login_redesigned_inputs:", login_path)

            # 2. Inject auth and reload to go to Dashboard
            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(3.5)

            # Focus Dashboard search and type text
            type_dash_js = """
                const searchInput = document.querySelector('.search-field input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.value = 'Sarah';
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            """
            await send_cmd("Runtime.evaluate", {"expression": type_dash_js})
            await asyncio.sleep(0.8)

            # Capture Dashboard with active search box
            dash_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            dash_path = os.path.join(ARTIFACT_DIR, "dashboard_search_box.png")
            with open(dash_path, "wb") as f:
                f.write(base64.b64decode(dash_screen["data"]))
            print("Saved dashboard_search_box:", dash_path)

            # 3. Switch to Checkout page (index 3 in sidebar)
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelectorAll('.sidebar-item')[3].click();"
            })
            await asyncio.sleep(2.5)

            # Type into checkout search
            type_co_js = """
                const coInput = document.querySelector('.search-field input');
                if (coInput) {
                    coInput.focus();
                    coInput.value = 'TechCorp';
                    coInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            """
            await send_cmd("Runtime.evaluate", {"expression": type_co_js})
            await asyncio.sleep(0.8)

            # Capture Checkout search
            co_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            co_path = os.path.join(ARTIFACT_DIR, "checkout_search_box.png")
            with open(co_path, "wb") as f:
                f.write(base64.b64decode(co_screen["data"]))
            print("Saved checkout_search_box:", co_path)

            # 4. Click 'View Checkout History' to test the redesigned history search bar
            await send_cmd("Runtime.evaluate", {
                "expression": "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Checkout History'))?.click();"
            })
            await asyncio.sleep(2.5)

            # Capture Checkout History search
            hist_screen = await send_cmd("Page.captureScreenshot", {"format": "png"})
            hist_path = os.path.join(ARTIFACT_DIR, "checkout_history_search_box.png")
            with open(hist_path, "wb") as f:
                f.write(base64.b64decode(hist_screen["data"]))
            print("Saved checkout_history_search_box:", hist_path)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(verify())
