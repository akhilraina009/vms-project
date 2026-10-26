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
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_inspect_align"

async def inspect():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN", "first_name": "Akhil"}

    # Launch Chrome at the width in the user's screenshot (~580px wide)
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9260",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=600,900",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9260/json").read().decode()
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

            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(3.0)

            # Navigate to Pre-Approvals
            await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    const pBtn = btns.find(b => b.innerText.includes('Pre-Approvals'));
                    if (pBtn) pBtn.click();
                })()
                """
            })
            await asyncio.sleep(2.0)

            # Inspect elements
            res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const header = document.querySelector('.it-management-header');
                    const titleBox = document.querySelector('.it-header-title-box');
                    const controls = document.querySelector('.it-header-controls');
                    const statsGrid = document.querySelector('.stats-grid');
                    const statCards = Array.from(document.querySelectorAll('.stats-grid .stat-card'));

                    return {
                        windowWidth: window.innerWidth,
                        header: header ? {
                            offsetHeight: header.offsetHeight,
                            computedHeight: window.getComputedStyle(header).height,
                            flexDirection: window.getComputedStyle(header).flexDirection,
                            alignItems: window.getComputedStyle(header).alignItems,
                            justifyContent: window.getComputedStyle(header).justifyContent,
                            rect: header.getBoundingClientRect()
                        } : null,
                        titleBox: titleBox ? {
                            offsetHeight: titleBox.offsetHeight,
                            rect: titleBox.getBoundingClientRect()
                        } : null,
                        controls: controls ? {
                            offsetHeight: controls.offsetHeight,
                            rect: controls.getBoundingClientRect(),
                            justifyContent: window.getComputedStyle(controls).justifyContent
                        } : null,
                        statsGrid: statsGrid ? {
                            columns: window.getComputedStyle(statsGrid).gridTemplateColumns,
                            gap: window.getComputedStyle(statsGrid).gap,
                            rect: statsGrid.getBoundingClientRect()
                        } : null,
                        cardsRects: statCards.map(c => ({
                            text: c.innerText.replace(/\\n/g, ' '),
                            rect: c.getBoundingClientRect()
                        }))
                    };
                })()
                """,
                "returnByValue": True
            })
            print(json.dumps(res.get("result", {}).get("value"), indent=2))

    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(inspect())
