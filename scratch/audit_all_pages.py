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
USER_DATA_DIR = r"C:\Users\CY2152_akhil\AppData\Local\Temp\chrome_dev_audit_all"
ARTIFACT_DIR = r"C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c"

PAGES = [
    "dashboard",
    "scanner",
    "visitors",
    "checkout",
    "checkout-history",
    "hosts",
    "pre-approvals",
    "notifications",
    "it-assets",
    "log-recovery",
    "it-pre-approvals",
    "it-visitors",
    "it-notifications",
    "it-checkout-history",
]

async def audit_all_pages():
    token = create_access_token(user_id=1, email="rainaakhil15@gmail.com", role="ADMIN")
    user_info = {"user_id": 1, "email": "rainaakhil15@gmail.com", "role": "ADMIN"}

    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--remote-debugging-port=9250",
        f"--user-data-dir={USER_DATA_DIR}",
        "--window-size=1520,1050",
        "https://localhost:5173/"
    ]
    proc = subprocess.Popen(cmd)
    time.sleep(3)
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9250/json").read().decode()
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
                check = await send_cmd("Runtime.evaluate", {"expression": """(() => {
                    return document.querySelectorAll('.sidebar-item').length;
                })()""", "returnByValue": True})
                if check.get("result", {}).get("value", 0) > 0:
                    break

            await asyncio.sleep(2)

            # Audit each page
            audit_results = {}
            for page in PAGES:
                print(f"\n--- Auditing: {page} ---", flush=True)

                # Navigate to page
                await send_cmd("Runtime.evaluate", {"expression": f"""(() => {{
                    // Try sidebar button first
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    // Also try direct page set
                    const appEl = document.querySelector('[class*="app"]');
                    // Use React state setter via event simulation
                }})()"""})

                # Directly set page via React internals
                nav_js = f"""(() => {{
                    const setPage = '{page}';
                    const btns = Array.from(document.querySelectorAll('.sidebar-item'));
                    // Map page names to sidebar text
                    const pageMap = {{
                        'dashboard': 'Dashboard',
                        'scanner': 'Scan Visitor',
                        'visitors': 'Visitors',
                        'checkout': 'Checkout',
                        'checkout-history': 'Checkout History',
                        'hosts': 'Hosts',
                        'pre-approvals': 'General Pre-Approvals',
                        'notifications': 'Notifications',
                        'it-assets': 'Asset Recovery',
                        'log-recovery': 'Log Asset Recovery',
                        'it-pre-approvals': 'IT Pre-Approvals',
                        'it-visitors': 'IT Visitors',
                        'it-notifications': 'IT Notifications',
                        'it-checkout-history': 'IT Checkout History',
                    }};
                    const text = pageMap[setPage];
                    if (text) {{
                        // Find the sidebar-item that contains this text but NOT a different longer match
                        for (const btn of btns) {{
                            const btnText = btn.textContent.trim();
                            if (btnText.includes(text)) {{
                                // Avoid matching 'Checkout History' when looking for 'Checkout'
                                if (setPage === 'checkout' && btnText.includes('History')) continue;
                                if (setPage === 'notifications' && btnText.includes('IT')) continue;
                                if (setPage === 'visitors' && btnText.includes('IT')) continue;
                                btn.click();
                                return 'clicked: ' + btnText;
                            }}
                        }}
                    }}
                    return 'NOT_FOUND: ' + text;
                }})()"""

                nav_result = await send_cmd("Runtime.evaluate", {"expression": nav_js, "returnByValue": True})
                print(f"  Nav: {nav_result.get('result', {}).get('value')}", flush=True)
                await asyncio.sleep(2.5)

                # Inspect font, colors, layout
                audit_js = """(() => {
                    const mainContent = document.querySelector('.main-content');
                    if (!mainContent) return { error: 'no .main-content' };

                    const cs = window.getComputedStyle(mainContent);
                    
                    // Check all visible text elements for font consistency
                    const textEls = mainContent.querySelectorAll('h1, h2, h3, h4, p, span, strong, td, th, label, button, input, a');
                    const fontFamilies = new Set();
                    const fontIssues = [];
                    
                    textEls.forEach(el => {
                        const style = window.getComputedStyle(el);
                        const ff = style.fontFamily;
                        fontFamilies.add(ff.split(',')[0].trim().replace(/['"]/g, ''));
                        
                        // Check for common issues
                        const fontSize = parseFloat(style.fontSize);
                        if (fontSize < 10 && el.tagName !== 'SPAN' && el.innerText.trim().length > 3) {
                            fontIssues.push({ tag: el.tagName, text: el.innerText.trim().substring(0, 40), fontSize });
                        }
                    });

                    // Check headings
                    const h2 = mainContent.querySelector('h2');
                    const h2Style = h2 ? window.getComputedStyle(h2) : null;

                    // Check tables
                    const table = mainContent.querySelector('table');
                    const tableHeaders = table ? Array.from(table.querySelectorAll('th')).map(th => ({
                        text: th.textContent.trim(),
                        font: window.getComputedStyle(th).fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
                        size: window.getComputedStyle(th).fontSize,
                        weight: window.getComputedStyle(th).fontWeight
                    })) : [];

                    // Check background colors
                    const bg = cs.backgroundColor;
                    
                    // Check for any dark-themed elements (old design remnants)
                    const darkEls = Array.from(mainContent.querySelectorAll('*')).filter(el => {
                        const s = window.getComputedStyle(el);
                        const bgColor = s.backgroundColor;
                        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                            // Check if it's a very dark background (non-intentional)
                            const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                            if (match) {
                                const [r, g, b] = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
                                if (r < 30 && g < 30 && b < 50 && el.offsetWidth > 100 && el.offsetHeight > 30) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    }).slice(0, 3).map(el => ({
                        tag: el.tagName,
                        class: el.className.substring(0, 60),
                        bg: window.getComputedStyle(el).backgroundColor,
                        size: `${el.offsetWidth}x${el.offsetHeight}`
                    }));

                    return {
                        mainBg: bg,
                        fontFamilies: [...fontFamilies],
                        fontIssueCount: fontIssues.length,
                        fontIssues: fontIssues.slice(0, 5),
                        h2: h2 ? {
                            text: h2.textContent.trim().substring(0, 50),
                            font: h2Style.fontFamily.split(',')[0].trim().replace(/['"]/g, ''),
                            size: h2Style.fontSize,
                            weight: h2Style.fontWeight,
                            color: h2Style.color
                        } : null,
                        tableHeaders: tableHeaders.slice(0, 5),
                        darkElements: darkEls
                    };
                })()"""

                audit_result = await send_cmd("Runtime.evaluate", {"expression": audit_js, "returnByValue": True})
                page_audit = audit_result.get("result", {}).get("value", {})
                audit_results[page] = page_audit
                print(f"  Fonts: {page_audit.get('fontFamilies', [])}", flush=True)
                print(f"  Font Issues: {page_audit.get('fontIssueCount', 0)}", flush=True)
                if page_audit.get('darkElements'):
                    print(f"  Dark Elements: {page_audit.get('darkElements')}", flush=True)
                if page_audit.get('h2'):
                    print(f"  H2: {page_audit['h2']}", flush=True)

                # Capture screenshot
                ss = await send_cmd("Page.captureScreenshot", {"format": "png"})
                img_path = os.path.join(ARTIFACT_DIR, f"audit_{page.replace('-','_')}.png")
                with open(img_path, "wb") as f:
                    f.write(base64.b64decode(ss["data"]))
                print(f"  Screenshot: {img_path}", flush=True)

            # Summary
            print("\n\n=== AUDIT SUMMARY ===", flush=True)
            all_fonts = set()
            for page, data in audit_results.items():
                for f in data.get('fontFamilies', []):
                    all_fonts.add(f)
            print(f"All fonts used across pages: {sorted(all_fonts)}", flush=True)

            total_issues = sum(d.get('fontIssueCount', 0) for d in audit_results.values())
            print(f"Total font size issues: {total_issues}", flush=True)

            dark_pages = [p for p, d in audit_results.items() if d.get('darkElements')]
            if dark_pages:
                print(f"Pages with dark-themed remnants: {dark_pages}", flush=True)

            # Save audit JSON
            audit_path = os.path.join(ARTIFACT_DIR, "audit_results.json")
            with open(audit_path, "w") as f:
                json.dump(audit_results, f, indent=2)
            print(f"Saved audit JSON to {audit_path}", flush=True)

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(audit_all_pages())
