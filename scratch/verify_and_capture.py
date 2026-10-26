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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_it_dossier_verify"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def verify_dossier():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9234",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1520,1150",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9234/json").read().decode()
        targets = json.loads(targets_res)
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
                    return btns.map(b => b.innerText.replace(/\\s+/g, ' ').trim());
                })()""", "returnByValue": True})
                buttons = check_sidebar.get("result", {}).get("value") or []
                if any("IT Checkout History" in b for b in buttons):
                    break

            # Click IT Checkout History
            await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                const b = btns.find(x => x.textContent.includes('IT Checkout History'));
                if (b) b.click();
            })()"""})
            await asyncio.sleep(2.5)

            # Click View Dossier on first row
            await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btn = document.querySelector('tbody tr button');
                if (btn) btn.click();
            })()"""})
            await asyncio.sleep(2.5)

            # Check DOM specs
            specs_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const cells = Array.from(document.querySelectorAll('.it-spec-cell')).map(c => {
                    const l = c.querySelector('.it-spec-label')?.textContent || '';
                    const v = c.querySelector('.it-spec-value')?.textContent || '';
                    return { label: l, val: v };
                });
                const av = document.querySelector('.it-contractor-avatar');
                const avStyle = av ? window.getComputedStyle(av) : null;
                const signoffs = Array.from(document.querySelectorAll('.it-signoff-card')).map(s => {
                    return {
                        title: s.querySelector('.it-signoff-title')?.textContent,
                        stamp: s.querySelector('.it-signoff-stamp')?.textContent,
                        name: s.querySelector('.it-signoff-name')?.textContent
                    };
                });
                return {
                    specs: cells,
                    avatar: av ? {
                        text: av.innerText,
                        bg: avStyle.backgroundImage || avStyle.backgroundColor,
                        color: avStyle.color,
                        radius: avStyle.borderRadius
                    } : null,
                    signoffs: signoffs
                };
            })()""", "returnByValue": True})
            print("DOSSIER DOM VERIFICATION:")
            print(json.dumps(specs_eval.get("result", {}).get("value"), indent=2))

            # Capture screenshot
            screen_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_path_dossier = os.path.join(ARTIFACT_DIR, "it_checkout_dossier_redesigned.png")
            with open(screen_path_dossier, "wb") as f:
                f.write(base64.b64decode(screen_ss["data"]))
            print("Successfully saved redesigned dossier to", screen_path_dossier)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(verify_dossier())
