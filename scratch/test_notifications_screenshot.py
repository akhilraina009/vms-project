import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64
import os
import sys

# Ensure backend directory is in path and dotenv loaded
backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_notifs"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def test_notifications():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9228",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1440,1050",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9228/json").read().decode()
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
                if len(buttons) > 5:
                    print(f"Sidebar mounted after {attempt+1}s: {buttons}")
                    break

            # 1. Click "IT Notifications" in sidebar
            click_it_notif = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                const b = btns.find(x => x.textContent.includes('IT Notifications'));
                if (b) {
                    b.click();
                    return true;
                }
                return false;
            })()"""})
            print("Clicked IT Notifications:", click_it_notif.get("result", {}).get("value"))
            await asyncio.sleep(2.5)

            # Read IT notifications info from DOM
            it_info_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const title = document.querySelector('.notif-page-title')?.textContent || '';
                const pill = document.querySelector('.notif-division-pill')?.textContent || '';
                const badgeCount = document.querySelector('.sidebar-item.active .notification-count')?.textContent || '';
                const items = Array.from(document.querySelectorAll('.notif-item-row')).map(row => {
                    const t = row.querySelector('.notif-title')?.textContent || '';
                    const badge = row.querySelector('.notif-category-badge')?.textContent || '';
                    const msg = row.querySelector('.notif-message-text')?.textContent || '';
                    return { t, badge, msg: msg.substring(0, 60) };
                });
                return { title, pill, badgeCount, count: items.length, sample: items.slice(0, 6) };
            })()""", "returnByValue": True})
            print("IT Notifications View State:", json.dumps(it_info_eval.get("result", {}).get("value"), indent=2))

            # Capture IT Notifications screenshot
            screen_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_path_it = os.path.join(ARTIFACT_DIR, "it_notifications_view.png")
            with open(screen_path_it, "wb") as f:
                f.write(base64.b64decode(screen_ss["data"]))
            print("Captured IT Notifications to", screen_path_it)

            # 2. Click "Notifications" (General) in sidebar
            click_gen_notif = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                const b = btns.find(x => x.textContent.trim().startsWith('Notifications'));
                if (b) {
                    b.click();
                    return true;
                }
                return false;
            })()"""})
            print("Clicked General Notifications:", click_gen_notif.get("result", {}).get("value"))
            await asyncio.sleep(2.5)

            # Read General notifications info from DOM
            gen_info_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const title = document.querySelector('.notif-page-title')?.textContent || '';
                const pill = document.querySelector('.notif-division-pill')?.textContent || '';
                const badgeCount = document.querySelector('.sidebar-item.active .notification-count')?.textContent || '';
                const items = Array.from(document.querySelectorAll('.notif-item-row')).map(row => {
                    const t = row.querySelector('.notif-title')?.textContent || '';
                    const badge = row.querySelector('.notif-category-badge')?.textContent || '';
                    const msg = row.querySelector('.notif-message-text')?.textContent || '';
                    return { t, badge, msg: msg.substring(0, 60) };
                });
                return { title, pill, badgeCount, count: items.length, sample: items.slice(0, 6) };
            })()""", "returnByValue": True})
            print("General Notifications View State:", json.dumps(gen_info_eval.get("result", {}).get("value"), indent=2))

            # Capture General Notifications screenshot
            screen_ss2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_path_gen = os.path.join(ARTIFACT_DIR, "general_notifications_view.png")
            with open(screen_path_gen, "wb") as f:
                f.write(base64.b64decode(screen_ss2["data"]))
            print("Captured General Notifications to", screen_path_gen)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_notifications())
