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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_guard_test"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\c30d2fd5-088d-4597-a9c1-3ce80009d246"
OUT_IMG = os.path.join(ARTIFACT_DIR, "guard_pending_visit_dossier.png")

async def test_guard():
    token = create_access_token(user_id=1, email="guard@vms.com", role="SECURITY")
    user_info = {"user_id": 1, "email": "guard@vms.com", "role": "SECURITY"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9311",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1400,1050",
        "https://localhost:5173/guard"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9311/json").read().decode()
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

            # Trigger lookup for 90713b40-bda3-4134-945a-d36fe42fba3b using the input
            type_and_verify = """
                const input = document.querySelector('input');
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeSetter.call(input, 'https://localhost:5173/visitor-pass/90713b40-bda3-4134-945a-d36fe42fba3b');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify Pass'));
                if (btn) btn.click();
            """
            await send_cmd("Runtime.evaluate", {"expression": type_and_verify})
            await asyncio.sleep(2.5)

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            if shot and "data" in shot:
                with open(OUT_IMG, "wb") as f:
                    f.write(base64.b64decode(shot["data"]))
                print("SUCCESS pending pass screenshot:", OUT_IMG)
    finally:
        proc.terminate()

asyncio.run(test_guard())
