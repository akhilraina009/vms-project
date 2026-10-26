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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_it_verify_final"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def test_complete_view():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9236",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1520,1150",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9236/json").read().decode()
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

            # 1. Capture screen view
            screen_res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_bytes = base64.b64decode(screen_res["data"])
            screen_path = os.path.join(ARTIFACT_DIR, "it_checkout_dossier_redesigned.png")
            with open(screen_path, "wb") as f:
                f.write(screen_bytes)
            print(f"Captured screen view to {screen_path} ({len(screen_bytes)} bytes)")

            # 2. Check layout dimensions in screen view
            dim_res = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const card = document.querySelector('.it-dossier-card');
                const sheet = document.querySelector('.it-cert-sheet');
                const cols = document.querySelector('.it-dossier-columns-grid');
                return {
                    cardWidth: card ? card.offsetWidth : 0,
                    cardHeight: card ? card.offsetHeight : 0,
                    sheetWidth: sheet ? sheet.offsetWidth : 0,
                    sheetHeight: sheet ? sheet.offsetHeight : 0,
                    colsGrid: cols ? window.getComputedStyle(cols).gridTemplateColumns : null
                };
            })()""", "returnByValue": True})
            print("Screen dimensions:", dim_res.get("result", {}).get("value"))

            # 3. Emulate print media & capture screenshot of print appearance
            await send_cmd("Emulation.setEmulatedMedia", {"media": "print"})
            await asyncio.sleep(1)

            print_dim_res = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const sheet = document.querySelector('.it-cert-sheet');
                const cols = document.querySelector('.it-dossier-columns-grid');
                return {
                    sheetHeight: sheet ? sheet.offsetHeight : 0,
                    colsGrid: cols ? window.getComputedStyle(cols).gridTemplateColumns : null
                };
            })()""", "returnByValue": True})
            print("Emulated print dimensions:", print_dim_res.get("result", {}).get("value"))

            print_preview_res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            print_preview_bytes = base64.b64decode(print_preview_res["data"])
            print_preview_path = os.path.join(ARTIFACT_DIR, "it_checkout_print_preview.png")
            with open(print_preview_path, "wb") as f:
                f.write(print_preview_bytes)
            print(f"Captured print preview screenshot to {print_preview_path} ({len(print_preview_bytes)} bytes)")

            # Reset media emulation
            await send_cmd("Emulation.setEmulatedMedia", {"media": ""})

            # 4. Generate actual PDF via CDP printToPDF
            pdf_res = await send_cmd("Page.printToPDF", {
                "paperWidth": 8.27, # A4 width in inches
                "paperHeight": 11.69, # A4 height in inches
                "marginTop": 0.35,
                "marginBottom": 0.35,
                "marginLeft": 0.4,
                "marginRight": 0.4,
                "printBackground": True,
                "preferCSSPageSize": True
            })

            pdf_data = base64.b64decode(pdf_res["data"])
            pdf_path = os.path.join(ARTIFACT_DIR, "it_checkout_certificate.pdf")
            with open(pdf_path, "wb") as f:
                f.write(pdf_data)

            page_count = pdf_data.count(b"/Type /Page") or pdf_data.count(b"/Type/Page")
            print(f"Generated PDF at {pdf_path}, size={len(pdf_data)} bytes, detected pages={page_count}")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_complete_view())
