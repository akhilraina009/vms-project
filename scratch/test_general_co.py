import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import os
import sys

backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_gen_checkout"

async def test_gen_checkout_history():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9231",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1480,1100",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9231/json").read().decode()
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
            
            # Wait for sidebar
            for attempt in range(20):
                await asyncio.sleep(1)
                check_sidebar = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    return btns.map(b => b.innerText.replace(/\\s+/g, ' ').trim());
                })()""", "returnByValue": True})
                buttons = check_sidebar.get("result", {}).get("value") or []
                if "Checkout History" in buttons:
                    break

            # Click general "Checkout History"
            click_gen_co = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                const b = btns.find(x => x.textContent.trim() === 'Checkout History');
                if (b) {
                    b.click();
                    return true;
                }
                return false;
            })()"""})
            print("Clicked General Checkout History:", click_gen_co.get("result", {}).get("value"))
            await asyncio.sleep(2.5)

            gen_co_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const countText = document.querySelector('.page-card p')?.textContent || '';
                const rows = Array.from(document.querySelectorAll('tbody tr')).map(row => {
                    return row.innerText.replace(/\\s+/g, ' ').trim();
                });
                const hasIT = rows.some(r => r.includes('[IT_VISIT]') || r.includes('IT Contractor') || r.includes('Network Switch'));
                return { countText, count: rows.length, hasIT, sample: rows.slice(0, 3) };
            })()""", "returnByValue": True})
            print("General Checkout History State:", json.dumps(gen_co_eval.get("result", {}).get("value"), indent=2))

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_gen_checkout_history())
