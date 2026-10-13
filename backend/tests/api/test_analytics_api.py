"""API integration tests for real analytics dashboard aggregations."""
import pytest


@pytest.mark.asyncio
async def test_analytics_dashboard_metrics(
    client, admin_headers, reporter_headers, seed_data
):
    """Test dashboard metrics calculation against actual database records."""
    dept = seed_data["department"]
    cat = seed_data["category"]

    # 1. Create a few feedback records with different statuses
    for i in range(3):
        await client.post(
            "/api/v1/public/feedback",
            json={
                "title": f"Test issue {i}",
                "description": f"Detailed description for test issue {i}",
                "category_id": str(cat.id),
                "department_id": str(dept.id),
                "is_anonymous": True,
            },
        )

    # 2. Admin requests dashboard
    response = await client.get("/api/v1/analytics/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()

    assert "summary" in data
    assert data["summary"]["total_submissions"] >= 3
    assert data["summary"]["unresolved_count"] >= 3
    assert "category_distribution" in data
    assert "priority_distribution" in data
    assert "department_workload" in data

    # 3. Reporter requests dashboard -> MUST BE FORBIDDEN (403)
    rep_response = await client.get("/api/v1/analytics/dashboard", headers=reporter_headers)
    assert rep_response.status_code == 403
