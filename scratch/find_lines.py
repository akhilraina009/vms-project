with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'const renderNotifications = () => {' in line:
        print(f'renderNotifications at line {i+1}')
    if 'IT DEPARTMENT' in line:
        print(f'IT DEPARTMENT at line {i+1}')
    if 'currentPage === "notifications"' in line:
        print(f'currentPage === notifications at line {i+1}')
