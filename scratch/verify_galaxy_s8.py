import subprocess, time, json, urllib.request, asyncio, websockets, base64, os, sys
backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_galaxy_s8"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\069479e1-d2d7-4fe8-aeac-1c57507e3270"

async def test_galaxy():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN", "first_name": "Akhil", "last_name": "Raina"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9265",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=360,800",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.0)
    try:
        targets = json.loads(urllib.request.urlopen("http://127.0.0.1:9265/json").read().decode())
        page_target = next(t for t in targets if t.get("type") == "page")
        async with websockets.connect(page_target["webSocketDebuggerUrl"]) as ws:
            cid = 1
            async def send_cmd(method, params=None):
                nonlocal cid
                m_id = cid
                cid += 1
                await ws.send(json.dumps({"id": m_id, "method": method, "params": params or {}}))
                while True:
                    r = json.loads(await ws.recv())
                    if r.get("id") == m_id: return r.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")

            inject_js = f"""
                localStorage.setItem('vms_token', '{token}');
                localStorage.setItem('vms_user', JSON.stringify({json.dumps(user_info)}));
                location.reload();
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_js})
            await asyncio.sleep(2.5)

            # Samsung Galaxy S8+ emulation: 360 x 800
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": 360,
                "height": 800,
                "deviceScaleFactor": 3,
                "mobile": True
            })
            await asyncio.sleep(0.5)

            # 1. Capture Dashboard on Galaxy S8+
            shot1 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "galaxy_s8_dashboard.png"), "wb") as f:
                f.write(base64.b64decode(shot1["data"]))
            print("Saved galaxy_s8_dashboard.png")

            # 2. Open Sidebar Drawer on Galaxy S8+
            await send_cmd("Runtime.evaluate", {
                "expression": "document.querySelector('.mobile-topbar-menu-btn').click();"
            })
            await asyncio.sleep(0.6)

            shot2 = await send_cmd("Page.captureScreenshot", {"format": "png"})
            with open(os.path.join(ARTIFACT_DIR, "galaxy_s8_drawer_open.png"), "wb") as f:
                f.write(base64.b64decode(shot2["data"]))
            print("Saved galaxy_s8_drawer_open.png")

            # Inspect profile and label computed styles
            info = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const label = document.querySelector('.sidebar-label');
                    const profileName = document.querySelector('.security-profile strong');
                    const item = document.querySelector('.sidebar-item');
                    const bottom = document.querySelector('.sidebar-bottom');
                    return {
                        labelDisplay: label ? window.getComputedStyle(label).display : 'none',
                        labelText: label ? label.innerText : '',
                        profileNameDisplay: profileName ? window.getComputedStyle(profileName).display : 'none',
                        profileNameText: profileName ? profileName.innerText : '',
                        itemJustify: item ? window.getComputedStyle(item).justifyContent : '',
                        bottomOffsetTop: bottom ? bottom.offsetTop : 0,
                        bottomOffsetHeight: bottom ? bottom.offsetHeight : 0
                    };
                })()
                """,
                "returnByValue": True
            })
            print("DOM inspection:", json.dumps(info.get("result", {}).get("value"), indent=2))
    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(test_galaxy())
