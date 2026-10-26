import json

with open(r'C:\Users\CY2152_akhil\.gemini\antigravity\brain\af781533-e7d1-4eec-b648-6f6f1097769c\audit_results.json', 'r') as f:
    data = json.load(f)

for page, info in data.items():
    issues = info.get('fontIssues', [])
    dark = info.get('darkElements', [])
    h2 = info.get('h2', {})
    fonts = info.get('fontFamilies', [])
    headers = info.get('tableHeaders', [])
    print(f"=== {page} ===")
    print(f"  Fonts: {fonts}")
    print(f"  H2: size={h2.get('size','?')} weight={h2.get('weight','?')} color={h2.get('color','?')}")
    if issues:
        print(f"  FONT ISSUES ({len(issues)}):")
        for i in issues:
            print(f"    {i}")
    if dark:
        print(f"  DARK ELEMENTS ({len(dark)}):")
        for d in dark:
            print(f"    {d}")
    if headers:
        print(f"  Table Headers: {headers[:3]}")
    print()
