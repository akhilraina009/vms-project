from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.employee import Employee
from app.models.security_user import SecurityUser
from app.schemas.employee import EmployeeCreate, EmployeeResponse
from app.services.auth_dependencies import get_current_user, require_roles


router = APIRouter(
    prefix="/employees",
    tags=["Employees"]
)


@router.post(
    "/",
    response_model=EmployeeResponse
)
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN")),
):
    employee = Employee(
        first_name=employee_data.first_name,
        last_name=employee_data.last_name,
        email=employee_data.email,
        department=employee_data.department,
    )

    db.add(employee)

    await db.commit()
    await db.refresh(employee)

    return employee


@router.get(
    "/",
    response_model=list[EmployeeResponse]
)
async def get_employees(
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN", "EMPLOYEE")),
):
    result = await db.execute(
        select(Employee).order_by(Employee.employee_id)
    )

    employees = result.scalars().all()

    return employees