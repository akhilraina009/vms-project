from fastapi import APIRouter, Depends, HTTPException, status
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
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN", "MANAGEMENT", "IT", "IT_COVERYOU")),
):
    # Check if email already registered
    existing = await db.execute(select(Employee).where(Employee.email == employee_data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with email '{employee_data.email}' already exists."
        )

    employee = Employee(
        first_name=employee_data.first_name.strip(),
        last_name=employee_data.last_name.strip(),
        email=employee_data.email.strip().lower(),
        department=employee_data.department.strip() if employee_data.department else None,
        phone_number=employee_data.phone_number.strip() if employee_data.phone_number else None,
        designation=employee_data.designation.strip() if employee_data.designation else None,
        office_location=employee_data.office_location.strip() if employee_data.office_location else None,
        notes=employee_data.notes.strip() if employee_data.notes else None,
        status=employee_data.status or "ACTIVE",
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
    current_user: SecurityUser = Depends(require_roles("ADMIN", "MANAGEMENT", "EMPLOYEE", "SECURITY", "IT", "IT_COVERYOU")),
):
    result = await db.execute(
        select(Employee).order_by(Employee.employee_id)
    )
    employees = result.scalars().all()
    return employees


@router.get(
    "/{employee_id}",
    response_model=EmployeeResponse
)
async def get_employee(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN", "MANAGEMENT", "EMPLOYEE", "SECURITY", "IT", "IT_COVERYOU")),
):
    result = await db.execute(
        select(Employee).where(Employee.employee_id == employee_id)
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    return employee
