with open('backend/app/routers/visit.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'from app.services.auth_dependencies import get_current_user, require_roles',
    'from app.services.auth_dependencies import get_current_user, get_optional_current_user, require_roles'
)

text = text.replace(
    'current_user: SecurityUser = Depends(get_current_user),\n):\n    result = await db.execute(\n        select(Visit)\n        .options(\n            selectinload(Visit.visitor),\n            selectinload(Visit.host_employee),\n            selectinload(Visit.assets),\n        )\n        .where(Visit.visit_id == visit_id)\n    )',
    'current_user: SecurityUser | None = Depends(get_optional_current_user),\n):\n    result = await db.execute(\n        select(Visit)\n        .options(\n            selectinload(Visit.visitor),\n            selectinload(Visit.host_employee),\n            selectinload(Visit.assets),\n        )\n        .where(Visit.visit_id == visit_id)\n    )'
)

text = text.replace(
    '@router.get(\n    "/entry-decision/{visit_id}"\n)\nasync def security_entry_decision(\n    visit_id: UUID,\n    db: AsyncSession = Depends(get_db),\n    current_user: SecurityUser = Depends(get_current_user),',
    '@router.get(\n    "/entry-decision/{visit_id}"\n)\nasync def security_entry_decision(\n    visit_id: UUID,\n    db: AsyncSession = Depends(get_db),\n    current_user: SecurityUser | None = Depends(get_optional_current_user),'
)

text = text.replace(
    'verifier = current_user.email if (current_user and getattr(current_user, "email", None)) else (getattr(current_user, "username", "Security Gate"))',
    'verifier = current_user.email if (current_user and getattr(current_user, "email", None)) else (getattr(current_user, "username", "Security Gate") if current_user else "Security Gate Terminal")'
)

# Fix visit is None in security_verify_visit to raise 404
old_none = '''    if visit is None:
        return {
            "visit_id": visit_id,
            "status": "NOT_FOUND",
            "purpose": "",
            "visitor": {},
            "host_employee": {},
            "assets": [],
        }'''

new_none = '''    if visit is None:
        raise HTTPException(
            status_code=404,
            detail="Visit record not found.",
        )'''

text = text.replace(old_none, new_none)

with open('backend/app/routers/visit.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('SUCCESS')
