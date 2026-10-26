import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64
import os
import sys
import re

sys.path.insert(0, os.getcwd())

from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_admin_profile"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\004c03eb-0362-43fa-9bd8-1b9daa38cbfe"

async def test_executive_cert():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9222",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1440,1200",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9222/json").read().decode()
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

            # Click Checkout History in sidebar
            await send_cmd("Runtime.evaluate", {"expression": "(() => { const btns = Array.from(document.querySelectorAll('.sidebar-item')); const b = btns.find(x => x.textContent.includes('Checkout History')); if(b) b.click(); })()"})
            await asyncio.sleep(2)

            # Click View Details on Akhil Raina's row (with visitor photo and laptop photo)
            await send_cmd("Runtime.evaluate", {"expression": "(() => { const rows = Array.from(document.querySelectorAll('tbody tr')); const r = rows.find(x => x.textContent.includes('Akhil Raina')); if(r) { const b = r.querySelector('button'); if(b) b.click(); } })()"})
            await asyncio.sleep(2)

            # Capture on-screen details screenshot
            screen_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            screen_path = os.path.join(ARTIFACT_DIR, "executive_checkout_screen.png")
            with open(screen_path, "wb") as f:
                f.write(base64.b64decode(screen_ss["data"]))
            print("Captured on-screen screenshot to", screen_path)

            # Switch to print emulation with exact A4 dimensions (794x1123 @ 96 DPI)
            await send_cmd("Emulation.setEmulatedMedia", {"media": "print"})
            await send_cmd("Emulation.setDeviceMetricsOverride", {"width": 794, "height": 1123, "deviceScaleFactor": 1, "mobile": False})
            await asyncio.sleep(1)

            print_ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
            out_ss = os.path.join(ARTIFACT_DIR, "print_report_with_photos.png")
            with open(out_ss, "wb") as f:
                f.write(base64.b64decode(print_ss["data"]))
            print("Captured print report with photos to", out_ss)

            # Print to PDF with CSS page size (A4 Portrait)
            pdf = await send_cmd("Page.printToPDF", {"printBackground": True, "preferCSSPageSize": True})
            pdf_data = base64.b64decode(pdf["data"])
            out_pdf = os.path.join(ARTIFACT_DIR, "checkout_report_with_photos.pdf")
            with open(out_pdf, "wb") as f:
                f.write(pdf_data)
            print("Saved PDF to", out_pdf, f"size: {len(pdf_data)}")

            page_matches = re.findall(rb"/Count\s+(\d+)", pdf_data)
            pages_found = [m.start() for m in re.finditer(rb'/Type\s*/Page\b', pdf_data)]
            print(f"Total Page objects in PDF: {len(pages_found)}, Counts: {page_matches}")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_executive_cert())
