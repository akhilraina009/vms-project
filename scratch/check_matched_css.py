import subprocess, time, json, urllib.request, asyncio, websockets, os, sys
backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))
from app.services.auth_service import create_access_token

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_inspect_matched"

async def check():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9263",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=620,950",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(2.0)
    try:
        targets = json.loads(urllib.request.urlopen("http://127.0.0.1:9263/json").read().decode())
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
            matched_rules = []
            for rule_match in styles.get("matchedCSSRules", []):
                r = rule_match.get("rule", {})
                selectors = [s.get("text") for s in r.get("selectorList", {}).get("selectors", [])]
                css_props = [{p.get("name"): p.get("value")} for p in r.get("style", {}).get("cssProperties", []) if p.get("name") in ["align-items", "display", "flex-direction", "background", "border"]]
                if css_props:
                    matched_rules.append({
                        "selectors": selectors,
                        "origin": r.get("origin"),
                        "props": css_props
                    })

            print(json.dumps(matched_rules, indent=2))
    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(check())
