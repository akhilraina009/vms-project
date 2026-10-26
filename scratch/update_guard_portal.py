path = r'z:\vms-project\frontend\src\SecurityGuardPortal.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

replacement_lines = [
    '      // Fetch registered assets (prefer API, gracefully fall back to visitData/passFallbackData)\n',
    '      let initialAssets = Array.isArray(visitData?.assets) && visitData.assets.length > 0\n',
    '        ? [...visitData.assets]\n',
    '        : (Array.isArray(passFallbackData?.assets) && passFallbackData.assets.length > 0\n',
    '            ? [...passFallbackData.assets]\n',
    '            : []);\n',
    '\n',
    '      try {\n',
    '        const assetsRes = await fetch(\n',
    '          `${API_BASE_URL}/assets/?visit_id=${encodeURIComponent(resolvedVisitId)}`,\n',
    '          { headers: authHeaders() }\n',
    '        );\n',
    '        if (assetsRes.ok) {\n',
    '          const assetsData = await assetsRes.json();\n',
    '          if (Array.isArray(assetsData) && assetsData.length > 0) {\n',
    '            initialAssets = assetsData;\n',
    '          }\n',
    '        }\n',
    '      } catch (err) {\n',
    '        console.warn("Could not query assets endpoint, retaining dossier assets:", err);\n',
    '      }\n',
    '      setVisitAssets(initialAssets);\n'
]

lines[385:398] = replacement_lines

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('SUCCESS replaced lines in SecurityGuardPortal.jsx')
