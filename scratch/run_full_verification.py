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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_full_verification"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def main():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9240",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1480,1100",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9240/json").read().decode()
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

            print("Waiting for sidebar to load...", flush=True)
            for attempt in range(20):
                await asyncio.sleep(1)
                check_sidebar = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    return btns.map(b => b.innerText.replace(/\\s+/g, ' ').trim());
                })()""", "returnByValue": True})
                buttons = check_sidebar.get("result", {}).get("value") or []
                if any("IT Checkout History" in b for b in buttons):
                    print(f"Sidebar found with IT Checkout History after {attempt+1}s", flush=True)
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
            await asyncio.sleep(2)

            # 1. Capture screen view
            screen_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_img_path = os.path.join(ARTIFACT_DIR, "it_checkout_dossier_redesigned.png")
            with open(screen_img_path, "wb") as f:
                f.write(base64.b64decode(screen_ss["data"]))
            print(f"Captured screen view to {screen_img_path}", flush=True)

            # Inspect elements
            eval_inspect = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const card = document.querySelector('.it-dossier-card');
                const avatar = document.querySelector('.it-contractor-avatar');
                const specs = Array.from(document.querySelectorAll('.it-spec-cell')).map(c => ({
                    label: c.querySelector('.it-spec-label')?.textContent?.trim(),
                    val: c.querySelector('.it-spec-value')?.textContent?.trim()
                }));
                const signoffs = Array.from(document.querySelectorAll('.it-signoff-card')).map(s => ({
                    title: s.querySelector('.it-signoff-title')?.textContent?.trim(),
                    stamp: s.querySelector('.it-signoff-stamp')?.textContent?.trim(),
                    name: s.querySelector('.it-signoff-name')?.textContent?.trim()
                }));
                const assets = Array.from(document.querySelectorAll('.it-assets-table tbody tr')).map(r => 
                    r.innerText.replace(/\\s+/g, ' ').trim()
                );
                return {
                    avatarGradient: avatar ? window.getComputedStyle(avatar).background : null,
                    fontFamily: card ? window.getComputedStyle(card).fontFamily : null,
                    specsCount: specs.length,
                    specsSample: specs.slice(0, 4),
                    signoffs: signoffs,
                    assets: assets
                };
            })()""", "returnByValue": True})
            print("Inspected DOM:", json.dumps(eval_inspect.get("result", {}).get("value"), indent=2), flush=True)

            # 2. Emulate print media & capture print screenshot
            await send_cmd("Emulation.setEmulatedMedia", {"media": "print"})
            await asyncio.sleep(1)

            print_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            print_img_path = os.path.join(ARTIFACT_DIR, "it_dossier_print_fixed.png")
            with open(print_img_path, "wb") as f:
                f.write(base64.b64decode(print_ss["data"]))
            print(f"Captured print view screenshot to {print_img_path}", flush=True)

            # Check print dimensions
            print_eval = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const sheet = document.querySelector('.it-cert-sheet');
                const cols = document.querySelector('.it-dossier-columns-grid');
                return {
                    sheetHeightPx: sheet ? sheet.offsetHeight : 0,
                    gridCols: cols ? window.getComputedStyle(cols).gridTemplateColumns : null
                };
            })()""", "returnByValue": True})
            print("Print Layout Evaluation:", json.dumps(print_eval.get("result", {}).get("value"), indent=2), flush=True)

            # 3. Generate actual PDF
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

            # Count /Type /Page
            page_count = pdf_data.count(b"/Type /Page") or pdf_data.count(b"/Type/Page")
            print(f"Generated PDF to {pdf_path} (size={len(pdf_data)} bytes, PAGE COUNT={page_count})", flush=True)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(main())
