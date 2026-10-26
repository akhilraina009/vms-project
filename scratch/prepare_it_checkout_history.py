with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Check locations:
# 1. State definition location
pos_state = text.find('const [checkoutHistorySearch, setCheckoutHistorySearch] = useState("");')
print("pos_state found:", pos_state != -1)

# 2. useEffect location
pos_effect = text.find('if (currentPage === "checkout-history") {\n      fetchCheckoutHistory();\n    }')
print("pos_effect found:", pos_effect != -1)

# 3. renderCheckoutHistory location
pos_render = text.find('const renderCheckoutHistory = () => {')
print("pos_render found:", pos_render != -1)

# 4. Sidebar it-notifications location
pos_sidebar = text.find('currentPage === "it-notifications" ? "active" : ""')
print("pos_sidebar found:", pos_sidebar != -1)

# 5. Main view router checkout-history location
pos_router = text.find('{currentPage === "checkout-history" && (\n          renderCheckoutHistory()\n        )}')
print("pos_router found:", pos_router != -1)
