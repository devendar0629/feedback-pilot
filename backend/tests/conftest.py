"""Pytest test fixtures, async test client, database engine, and mocks."""
import asyncio
from typing import AsyncGenerator
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.api.deps import get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.base import Base
from app.models.category import Category
from app.models.department import Department
from app.models.user import User, UserRole

# In-memory SQLite async engine for isolated test runs
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create session-scoped event loop."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create fresh in-memory database tables for every test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTPX AsyncClient overriding database session dependency."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def seed_data(db_session: AsyncSession):
    """Seed test department, category, admin, agent, and reporter users."""
    # Department
    dept = Department(
        name="Engineering",
        code="ENG",
        description="Software and Infrastructure",
    )
    db_session.add(dept)
    await db_session.flush()

    # Category
    cat = Category(
        name="Software Defect",
        department_id=dept.id,
        description="System bugs",
    )
    db_session.add(cat)
    await db_session.flush()

    # Admin User
    admin = User(
        email="admin@test.io",
        hashed_password=hash_password("AdminPass123!"),
        full_name="Admin Tester",
        role=UserRole.ADMINISTRATOR,
        is_active=True,
    )
    db_session.add(admin)

    # Agent User
    agent = User(
        email="agent@test.io",
        hashed_password=hash_password("AgentPass123!"),
        full_name="Agent Tester",
        role=UserRole.AGENT,
        department_id=dept.id,
        is_active=True,
    )
    db_session.add(agent)

    # Reporter User
    reporter = User(
        email="reporter@test.io",
        hashed_password=hash_password("ReporterPass123!"),
        full_name="Reporter Tester",
        role=UserRole.REPORTER,
        is_active=True,
    )
    db_session.add(reporter)

    await db_session.commit()
    return {
        "department": dept,
        "category": cat,
        "admin": admin,
        "agent": agent,
        "reporter": reporter,
    }


@pytest.fixture
def admin_headers(seed_data) -> dict:
    admin = seed_data["admin"]
    token = create_access_token(
        subject=str(admin.id),
        claims={"role": admin.role.value, "email": admin.email},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def agent_headers(seed_data) -> dict:
    agent = seed_data["agent"]
    token = create_access_token(
        subject=str(agent.id),
        claims={"role": agent.role.value, "email": agent.email},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def reporter_headers(seed_data) -> dict:
    reporter = seed_data["reporter"]
    token = create_access_token(
        subject=str(reporter.id),
        claims={"role": reporter.role.value, "email": reporter.email},
    )
    return {"Authorization": f"Bearer {token}"}
