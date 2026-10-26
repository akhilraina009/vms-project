with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

pos1 = text.find('currentPage === "notifications" ? "active"')
print("=== SIDEBAR NOTIFICATIONS ===")
print(text[pos1-50:pos1+600])

pos2 = text.find('currentPage === "it-visitors" ? "active"')
print("=== SIDEBAR IT VISITORS ===")
print(text[pos2-50:pos2+300])
