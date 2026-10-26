import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64
import os
import sys

sys.path.insert(0, os.getcwd())

from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_it_visitors"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def test_it_visitors():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9224",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1440,1050",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9224/json").read().decode()
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
            
            inject_script = f"""
            localStorage.setItem('vms_token', {json.dumps(token)});
            localStorage.setItem('vms_user', {json.dumps(json.dumps(user_info))});
            window.location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_script})
            await asyncio.sleep(3)

            # Check sidebar items
            sidebar_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const items = Array.from(document.querySelectorAll('.sidebar-item')).map(x => x.textContent.trim());
                return JSON.stringify(items);
            })()"""})
            print("Sidebar items found:", sidebar_eval.get("result", {}).get("value"))

            # Click IT Visitors in sidebar
            click_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                const b = btns.find(x => x.textContent.includes('IT Visitors'));
                if (b) {
                    b.click();
                    return true;
                }
                return false;
            })()"""})
            print("Clicked IT Visitors:", click_eval.get("result", {}).get("value"))
            await asyncio.sleep(2.5)

            # Capture IT Visitors Directory screenshot
            screen_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_path = os.path.join(ARTIFACT_DIR, "it_visitors_directory.png")
            with open(screen_path, "wb") as f:
                f.write(base64.b64decode(screen_ss["data"]))
            print("Captured IT Visitors Directory to", screen_path)

            # Click Details button on the first visitor row
            details_click = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const rows = Array.from(document.querySelectorAll('tbody tr'));
                if (rows.length > 0) {
                    const btn = rows[0].querySelector('button');
                    if (btn) {
                        btn.click();
                        return true;
                    }
                }
                return false;
            })()"""})
            print("Clicked Details button on first row:", details_click.get("result", {}).get("value"))
            await asyncio.sleep(1.5)

            # Capture IT Visitor Details modal screenshot
            modal_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            modal_path = os.path.join(ARTIFACT_DIR, "it_visitor_dossier_modal.png")
            with open(modal_path, "wb") as f:
                f.write(base64.b64decode(modal_ss["data"]))
            print("Captured IT Visitor Dossier Modal to", modal_path)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_it_visitors())
