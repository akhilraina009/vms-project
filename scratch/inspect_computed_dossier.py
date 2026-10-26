import asyncio
import websockets
import json
import urllib.request

async def inspect():
    targets_res = urllib.request.urlopen("http://127.0.0.1:9233/json").read().decode()
    targets = json.loads(targets_res)
    ws_url = targets[0]["webSocketDebuggerUrl"]
    async with websockets.connect(ws_url) as ws:
        async def evaluate(expr):
            await ws.send(json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {"expression": expr, "returnByValue": True}
            }))
            res = json.loads(await ws.recv())
            return res.get("result", {}).get("result", {}).get("value")

        labels = await evaluate("""(() => {
            return Array.from(document.querySelectorAll('.it-spec-cell')).map(c => {
                const l = c.querySelector('.it-spec-label')?.textContent || '';
                const v = c.querySelector('.it-spec-value')?.textContent || '';
                return `${l}: ${v}`;
            });
        })()""")
        print("Specs in grid:", json.dumps(labels, indent=2))

        avatar = await evaluate("""(() => {
            const av = document.querySelector('.it-contractor-avatar');
            if (!av) return null;
            const cs = window.getComputedStyle(av);
            return {
                bg: cs.backgroundImage || cs.backgroundColor,
                color: cs.color,
                borderRadius: cs.borderRadius,
                text: av.innerText
            };
        })()""")
        print("Avatar computed style:", json.dumps(avatar, indent=2))

try:
    asyncio.run(inspect())
except Exception as e:
    print("Inspect error (Chrome likely closed):", e)
