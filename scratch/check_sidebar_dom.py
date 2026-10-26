import asyncio
import websockets
import json
import urllib.request

async def check():
    try:
        targets_res = urllib.request.urlopen("http://127.0.0.1:9227/json").read().decode()
        targets = json.loads(targets_res)
        ws_url = targets[0]["webSocketDebuggerUrl"]
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": "Array.from(document.querySelectorAll('.sidebar-item')).map(b => b.innerText.replace(/\\s+/g, ' ').trim())",
                    "returnByValue": True
                }
            }))
            res = json.loads(await ws.recv())
            print("SIDEBAR BUTTONS:", res.get("result", {}).get("result", {}).get("value"))
    except Exception as e:
        print("Error:", e)

asyncio.run(check())
