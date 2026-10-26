import subprocess, time, json, urllib.request, asyncio, websockets, os, sys
backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_inspect_rules"

async def check():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9262",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=620,950",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.0)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9262/json").read().decode()
        targets = json.loads(targets_res)
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
            await asyncio.sleep(1.5)

            res = await send_cmd("Runtime.evaluate", {
                "expression": """
                (() => {
                    const h = document.querySelector('.it-management-header');
                    const cs = window.getComputedStyle(h);
                    const c = document.querySelector('.it-header-controls');
                    const ccs = window.getComputedStyle(c);
                    const g = document.querySelector('.stats-grid');
                    const gcs = window.getComputedStyle(g);
                    return {
                        windowWidth: window.innerWidth,
                        h_display: cs.display,
                        h_flexDirection: cs.flexDirection,
                        h_alignItems: cs.alignItems,
                        h_justifyContent: cs.justifyContent,
                        h_border: cs.border,
                        h_bg: cs.backgroundColor,
                        c_display: ccs.display,
                        c_marginLeft: ccs.marginLeft,
                        c_marginRight: ccs.marginRight,
                        c_justifyContent: ccs.justifyContent,
                        grid_columns: gcs.gridTemplateColumns,
                        grid_classes: g.className
                    };
                })()
                """,
                "returnByValue": True
            })
            print(json.dumps(res.get("result", {}).get("value"), indent=2))
    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(check())
