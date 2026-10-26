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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_it_checkout"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def test_it_checkout_history():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9229",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1480,1100",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9229/json").read().decode()
        targets = json.loads(targets_res)
        ws_url = None
        for t in targets:
            if t.get("type") == "page":
                ws_url = t.get("webSocketDebuggerUrl")
                break
        if not ws_url:
            ws_url = targets[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            msg_id = 1
            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
                while True:
                    data = json.loads(await ws.recv())
                    if data.get("id") == cid:
                        return data.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")
            
            # Inject token and reload
            inject_script = f"""
            localStorage.setItem('vms_token', {json.dumps(token)});
            localStorage.setItem('vms_user', {json.dumps(json.dumps(user_info))});
            window.location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_script})
            
            # Poll until sidebar loads
            print("Waiting for sidebar to mount...")
            for attempt in range(20):
                await asyncio.sleep(1)
                check_sidebar = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    return btns.map(b => b.innerText.replace(/\\s+/g, ' ').trim());
                })()""", "returnByValue": True})
                buttons = check_sidebar.get("result", {}).get("value") or []
                if any("IT Checkout History" in b for b in buttons):
                    print(f"Sidebar mounted with IT Checkout History after {attempt+1}s: {buttons}")
                    break

            # 1. Click "IT Checkout History" in sidebar
            click_it_co = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                const b = btns.find(x => x.textContent.includes('IT Checkout History'));
                if (b) {
                    b.click();
                    return true;
                }
                return false;
            })()"""})
            print("Clicked IT Checkout History:", click_it_co.get("result", {}).get("value"))
            await asyncio.sleep(3)

            # Read IT Checkout History info from DOM
            it_co_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const title = document.querySelector('.notif-page-title')?.textContent || '';
                const pill = document.querySelector('.notif-division-pill')?.textContent || '';
                const rows = Array.from(document.querySelectorAll('tbody tr')).map(row => {
                    const text = row.innerText.replace(/\\s+/g, ' ').trim();
                    return text;
                });
                return { title, pill, count: rows.length, rows: rows };
            })()""", "returnByValue": True})
            print("IT Checkout History View State:", json.dumps(it_co_eval.get("result", {}).get("value"), indent=2))

            # Capture IT Checkout History table screenshot
            screen_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_path_it_co = os.path.join(ARTIFACT_DIR, "it_checkout_history_view.png")
            with open(screen_path_it_co, "wb") as f:
                f.write(base64.b64decode(screen_ss["data"]))
            print("Captured IT Checkout History to", screen_path_it_co)

            # 2. Click "View Dossier" on the first row
            click_dossier = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btn = document.querySelector('tbody tr button');
                if (btn) {
                    btn.click();
                    return true;
                }
                return false;
            })()"""})
            print("Clicked View Dossier:", click_dossier.get("result", {}).get("value"))
            await asyncio.sleep(2)

            # Capture IT Detailed Dossier screenshot
            screen_ss2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_path_dossier = os.path.join(ARTIFACT_DIR, "it_checkout_dossier_view.png")
            with open(screen_path_dossier, "wb") as f:
                f.write(base64.b64decode(screen_ss2["data"]))
            print("Captured IT Detailed Dossier to", screen_path_dossier)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_it_checkout_history())
