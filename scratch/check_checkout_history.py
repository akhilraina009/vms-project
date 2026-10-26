with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const fetchCheckoutHistory' in line:
        print("fetchCheckoutHistory starts at line", i+1)
        print(''.join(lines[i:i+40]))
    if 'const renderCheckoutHistory' in line:
        print("renderCheckoutHistory starts at line", i+1)
        print(''.join(lines[i:i+60]))
