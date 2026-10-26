const WebSocket = require('ws');
(async () => {
    try {
        const res = await fetch('http://127.0.0.1:9244/json');
        const targets = await res.json();
        const page = targets.find(t => t.type === 'page');
        if (!page) {
            console.log('No page found');
            process.exit(1);
        }
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        ws.on('open', () => {
            ws.send(JSON.stringify({
                id: 1,
                method: 'Runtime.evaluate',
                params: {
                    expression: '({ title: document.title, url: location.href, rows: document.querySelectorAll(".clickable-visitor-row").length, passCard: Boolean(document.querySelector(".vms-pass-card")), bodySnippet: document.body.innerText.slice(0, 300) })',
                    returnByValue: true
                }
            }));
        });
        ws.on('message', (data) => {
            const resp = JSON.parse(data);
            if (resp.id === 1) {
                console.log('PAGE STATE:', resp.result?.result?.value);
                process.exit(0);
            }
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
