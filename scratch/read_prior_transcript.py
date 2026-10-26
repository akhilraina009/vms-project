import json

transcript_path = r'C:\Users\CY2152_akhil\.gemini\antigravity\brain\c30d2fd5-088d-4597-a9c1-3ce80009d246\.system_generated\logs\transcript.jsonl'
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        idx = data.get('step_index')
        if idx is not None and 128 <= idx <= 135:
            print(f"STEP {idx} ({data.get('type')}):")
            if data.get('tool_calls'):
                print("  TOOL_CALLS:", data['tool_calls'])
            if data.get('content'):
                print("  CONTENT:", str(data['content'])[:200])
