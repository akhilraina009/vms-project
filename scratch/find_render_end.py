with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(1745, 2100):
    if lines[i].strip() == '};' or lines[i].startswith('  const '):
        print(f'{i+1}: {lines[i].strip()}')
