import subprocess, time, json, urllib.request, asyncio, websockets, os, sys
backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_inspect_url"

async def check():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9264",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=620,950",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.0)
    try:
        targets = json.loads(urllib.request.urlopen("http://127.0.0.1:9264/json").read().decode())
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
            await send_cmd("DOM.enable")
            await send_cmd("CSS.enable")

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

            doc = await send_cmd("DOM.getDocument")
            node = await send_cmd("DOM.querySelector", {"nodeId": doc["root"]["nodeId"], "selector": ".it-management-header"})
            node_id = node.get("nodeId")

            styles = await send_cmd("CSS.getMatchedStylesForNode", {"nodeId": node_id})
            for rule_match in styles.get("matchedCSSRules", []):
                r = rule_match.get("rule", {})
                selectors = [s.get("text") for s in r.get("selectorList", {}).get("selectors", [])]
                sheet_id = r.get("styleSheetId")
                sheet_header = await send_cmd("CSS.getStyleSheetText", {"styleSheetId": sheet_id}) if sheet_id else {}
                text = sheet_header.get("text", "")
                props = {p.get("name"): p.get("value") for p in r.get("style", {}).get("cssProperties", [])}
                if "align-items" in props:
                    print("SELECTOR:", selectors)
                    print("ALIGN-ITEMS:", props.get("align-items"))
                    print("CSS TEXT:", r.get("style", {}).get("cssText"))
                    print("SOURCE RANGE:", r.get("style", {}).get("range"))
                    print("---")
    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(check())
