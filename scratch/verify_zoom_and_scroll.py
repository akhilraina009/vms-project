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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_zoom_verify"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

async def test_zoom_and_scroll():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    # Start Chrome with short / zoomed viewport: 1200x650
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9245",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1200,650",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.5)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9245/json").read().decode()
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

            # Evaluate layout metrics at initial load (scrolled to top)
            eval_top = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const sidebar = document.querySelector('.sidebar');
                const nav = document.querySelector('.sidebar-nav-scroll');
                const logout = document.querySelector('.logout-button');
                const profile = document.querySelector('.security-profile');
                const winH = window.innerHeight;
                const logoutRect = logout ? logout.getBoundingClientRect() : null;
                const profileRect = profile ? profile.getBoundingClientRect() : null;
                
                return {
                    windowHeight: winH,
                    sidebarHeight: sidebar ? sidebar.offsetHeight : 0,
                    navScrollHeight: nav ? nav.scrollHeight : 0,
                    navClientHeight: nav ? nav.clientHeight : 0,
                    navCanScroll: nav ? nav.scrollHeight > nav.clientHeight : false,
                    logoutVisible: logoutRect ? (logoutRect.bottom <= winH && logoutRect.top >= 0) : false,
                    logoutRect: logoutRect ? { top: logoutRect.top, bottom: logoutRect.bottom } : null,
                    profileVisible: profileRect ? (profileRect.bottom <= winH && profileRect.top >= 0) : false,
                    profileRect: profileRect ? { top: profileRect.top, bottom: profileRect.bottom } : null
                };
            })()""", "returnByValue": True})
            print("INITIAL ZOOM STATE (Top):", json.dumps(eval_top.get("result", {}).get("value"), indent=2), flush=True)

            # Capture initial screenshot (with logout visible and top nav items)
            ss1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            ss1_path = os.path.join(ARTIFACT_DIR, "dashboard_zoomed_docked_logout.png")
            with open(ss1_path, "wb") as f:
                f.write(base64.b64decode(ss1["data"]))
            print(f"Captured initial view with docked logout to {ss1_path}", flush=True)

            # Now test scrolling the navigation container down!
            scroll_res = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const nav = document.querySelector('.sidebar-nav-scroll');
                if (nav) {
                    nav.scrollTop = nav.scrollHeight;
                    return { scrollTop: nav.scrollTop, maxScroll: nav.scrollHeight - nav.clientHeight };
                }
                return null;
            })()""", "returnByValue": True})
            print("Scrolled nav to bottom:", scroll_res.get("result", {}).get("value"), flush=True)
            await asyncio.sleep(1)

            # Check visibility of bottom IT items and logout while scrolled
            eval_bottom = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const itCoBtn = Array.from(document.querySelectorAll('.sidebar-item')).find(b => b.textContent.includes('IT Checkout History'));
                const itNotifBtn = Array.from(document.querySelectorAll('.sidebar-item')).find(b => b.textContent.includes('IT Notifications'));
                const logout = document.querySelector('.logout-button');
                const winH = window.innerHeight;
                
                const itCoRect = itCoBtn ? itCoBtn.getBoundingClientRect() : null;
                const logoutRect = logout ? logout.getBoundingClientRect() : null;

                return {
                    itCheckoutHistoryVisible: itCoRect ? (itCoRect.bottom <= winH && itCoRect.top >= 0) : false,
                    itCoRect: itCoRect ? { top: itCoRect.top, bottom: itCoRect.bottom } : null,
                    logoutStillVisible: logoutRect ? (logoutRect.bottom <= winH && logoutRect.top >= 0) : false,
                    logoutRect: logoutRect ? { top: logoutRect.top, bottom: logoutRect.bottom } : null
                };
            })()""", "returnByValue": True})
            print("AFTER SCROLLING NAV TO BOTTOM:", json.dumps(eval_bottom.get("result", {}).get("value"), indent=2), flush=True)

            # Capture screenshot while scrolled down (showing IT items and docked logout)
            ss2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            ss2_path = os.path.join(ARTIFACT_DIR, "dashboard_zoomed_scrolled_nav.png")
            with open(ss2_path, "wb") as f:
                f.write(base64.b64decode(ss2["data"]))
            print(f"Captured scrolled nav view to {ss2_path}", flush=True)

            # Test clicking "IT Checkout History" after scrolling to it!
            click_res = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                const itCoBtn = Array.from(document.querySelectorAll('.sidebar-item')).find(b => b.textContent.includes('IT Checkout History'));
                if (itCoBtn) {
                    itCoBtn.click();
                    return true;
                }
                return false;
            })()"""})
            print("Clicked IT Checkout History while zoomed:", click_res.get("result", {}).get("value"), flush=True)
            await asyncio.sleep(2)

            # Check that IT Checkout History opened properly
            page_title = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                return document.querySelector('.notif-page-title')?.textContent || document.querySelector('h2')?.textContent || '';
            })()""", "returnByValue": True})
            print("Current page after clicking IT Checkout History:", page_title.get("result", {}).get("value"), flush=True)

            # Capture screenshot of IT Checkout History in zoomed mode
            ss3 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            ss3_path = os.path.join(ARTIFACT_DIR, "it_checkout_history_zoomed.png")
            with open(ss3_path, "wb") as f:
                f.write(base64.b64decode(ss3["data"]))
            print(f"Captured IT Checkout History zoomed screenshot to {ss3_path}", flush=True)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(test_zoom_and_scroll())
