import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64
import os

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_pass_test2"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\c30d2fd5-088d-4597-a9c1-3ce80009d246"
OUT_IMG = os.path.join(ARTIFACT_DIR, "visitor_pass_fixed.png")

async def capture():
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9277",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1200,1050",
        "https://localhost:5173/visitor-pass/testpass123"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9277/json").read().decode()
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
            await asyncio.sleep(3.0)

            shot = await send_cmd("Page.captureScreenshot", {"format": "png"})
            if shot and "data" in shot:
                with open(OUT_IMG, "wb") as f:
                    f.write(base64.b64decode(shot["data"]))
                print("SUCCESS: Captured screenshot to", OUT_IMG)
            else:
                print("FAILED to capture screenshot")
    finally:
        proc.terminate()

asyncio.run(capture())
