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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_zoom_test"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def test_zoom():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9241",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1280,720", # Typical zoomed-in or laptop viewport
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9241/json").read().decode()
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

            for attempt in range(20):
                await asyncio.sleep(1)
                check_sidebar = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    return btns.length;
                })()""", "returnByValue": True})
                if check_sidebar.get("result", {}).get("value", 0) > 0:
                    break

            await asyncio.sleep(2)

            # Check sidebar dimensions and whether logout is in viewport
            check_dom = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const sidebar = document.querySelector('.sidebar');
                const logout = document.querySelector('.logout-button');
                const profile = document.querySelector('.security-profile');
                const winH = window.innerHeight;
                const logoutRect = logout ? logout.getBoundingClientRect() : null;
                const profileRect = profile ? profile.getBoundingClientRect() : null;
                const sidebarScrollH = sidebar ? sidebar.scrollHeight : 0;
                const sidebarClientH = sidebar ? sidebar.clientHeight : 0;
                
                return {
                    windowHeight: winH,
                    sidebarScrollHeight: sidebarScrollH,
                    sidebarClientHeight: sidebarClientH,
                    sidebarOverflows: sidebarScrollH > sidebarClientH,
                    logoutRect: logoutRect ? {
                        top: logoutRect.top,
                        bottom: logoutRect.bottom,
                        visible: logoutRect.bottom <= winH && logoutRect.top >= 0
                    } : null,
                    profileRect: profileRect ? {
                        top: profileRect.top,
                        bottom: profileRect.bottom,
                        visible: profileRect.bottom <= winH && profileRect.top >= 0
                    } : null
                };
            })()""", "returnByValue": True})
            print("Layout at 1280x720:")
            print(json.dumps(check_dom.get("result", {}).get("value"), indent=2))

            # Capture current screenshot
            ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "zoom_before_fix.png"), "wb") as f:
                f.write(base64.b64decode(ss["data"]))
            print("Saved zoom_before_fix.png")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_zoom())
