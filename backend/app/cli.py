"""Command-line administrative utilities for FeedbackPilot."""
import asyncio
import sys
from sqlalchemy import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.category import Category
from app.models.department import Department
from app.models.user import User, UserRole


async def create_admin(
    email: str = settings.INITIAL_ADMIN_EMAIL,
    password: str = settings.INITIAL_ADMIN_PASSWORD,
    full_name: str = settings.INITIAL_ADMIN_NAME,
):
    """Create or verify the initial administrator user."""
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.email == email.lower())
        res = await session.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            print(f"Administrator '{email}' already exists.")
            return

        admin = User(
            email=email.lower(),
            hashed_password=hash_password(password),
            full_name=full_name,
            role=UserRole.ADMINISTRATOR,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Created initial administrator: {email}")


async def seed_defaults():
    """Seed foundational departments and categories."""
    async with AsyncSessionLocal() as session:
        departments_data = [
            ("Technical Support", "TECH", "Product issues, bugs, and technical difficulties"),
            ("Billing & Payments", "BILLING", "Invoices, refunds, and subscription concerns"),
            ("Customer Service", "SUPPORT", "General customer inquiries and service requests"),
            ("Operations & Facilities", "OPS", "Physical facilities, delivery, and logistics"),
        ]

        dept_map = {}
        for name, code, desc in departments_data:
            stmt = select(Department).where(Department.code == code)
            res = await session.execute(stmt)
            dept = res.scalar_one_or_none()
            if not dept:
                dept = Department(name=name, code=code, description=desc)
                session.add(dept)
                await session.flush()
                print(f"Seeded department: {name}")
            dept_map[code] = dept

        categories_data = [
            ("Bug Report", "TECH", "Software malfunction or crash"),
            ("Feature Request", "TECH", "Suggestions for enhancements"),
            ("Payment Failure", "BILLING", "Card charged incorrectly or transaction failure"),
            ("Refund Request", "BILLING", "Customer asking for money back"),
            ("Service Delay", "SUPPORT", "Response or delivery time took too long"),
            ("Staff Conduct", "SUPPORT", "Feedback regarding representative behavior"),
        ]

        for name, dept_code, desc in categories_data:
            stmt = select(Category).where(Category.name == name)
            res = await session.execute(stmt)
            cat = res.scalar_one_or_none()
            if not cat:
                cat = Category(
                    name=name,
                    department_id=dept_map[dept_code].id if dept_code in dept_map else None,
                    description=desc,
                )
                session.add(cat)
                print(f"Seeded category: {name}")

        await session.commit()
        print("Default seed complete.")


def run_migrations_if_needed():
    try:
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
    except Exception as e:
        pass


async def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.cli [create-admin | seed-defaults | init-all]")
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "create-admin":
        await create_admin()
    elif cmd == "seed-defaults":
        await seed_defaults()
    elif cmd == "init-all":
        await seed_defaults()
        await create_admin()
    elif cmd == "generate-ai-scenarios":
        from app.services.ai_test_generator import generate_scenarios_with_gemini, save_scenarios
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        try:
            print(f"Generating {count} adversarial test scenarios with Gemini...")
            scenarios = generate_scenarios_with_gemini(count=count)
            save_scenarios(scenarios)
            print(f"Successfully generated and saved {len(scenarios)} scenarios.")
        except Exception as e:
            print(f"Generation failed: {e}")
            print("Note: Set GEMINI_API_KEY environment variable to enable live generation.")
    else:
        print(f"Unknown command: {cmd}")
        print("Usage: python -m app.cli [create-admin | seed-defaults | init-all | generate-ai-scenarios [count]]")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "init-all":
        run_migrations_if_needed()
    asyncio.run(main())
