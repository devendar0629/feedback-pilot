"""API integration tests for authentication and authorization."""
import pytest


@pytest.mark.asyncio
async def test_login_success(client, seed_data):
    """Test successful login with valid credentials."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.io", "password": "AdminPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@test.io"
    assert data["user"]["role"] == "administrator"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client, seed_data):
    """Test login failure with incorrect password."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.io", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_current_user_profile(client, admin_headers):
    """Test getting profile for authenticated user."""
    response = await client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.io"
    assert data["role"] == "administrator"


@pytest.mark.asyncio
async def test_unauthorized_profile_access(client):
    """Test requesting protected route without token returns 401."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
