"""API integration tests for public submission, listing, filtering, and role isolation."""
import pytest


@pytest.mark.asyncio
async def test_public_feedback_submission(client, seed_data):
    """Test public submission generates reference number and tracking secret."""
    cat = seed_data["category"]
    dept = seed_data["department"]

    payload = {
        "title": "Payment gateway timed out during checkout",
        "description": "I tried to purchase product A but the screen stayed blank after entering credit card.",
        "reporter_name": "Jane Citizen",
        "reporter_email": "jane@example.com",
        "category_id": str(cat.id),
        "department_id": str(dept.id),
        "location": "Online Store",
        "is_anonymous": False,
    }
    response = await client.post("/api/v1/public/feedback", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "reference_number" in data
    assert data["reference_number"].startswith("FP-")
    assert "tracking_secret" in data
    assert data["tracking_secret"].startswith("tr_")
    assert data["status"] == "submitted"


@pytest.mark.asyncio
async def test_feedback_role_based_access_isolation(client, seed_data, admin_headers, reporter_headers):
    """Test that reporters can ONLY see their own feedback, while administrators see all."""
    # Submit one feedback by reporter
    res1 = await client.post(
        "/api/v1/public/feedback",
        headers=reporter_headers,
        json={
            "title": "Reporter ticket 1",
            "description": "Description of reporter ticket 1 with sufficient detail.",
            "is_anonymous": False,
        },
    )
    assert res1.status_code == 201

    # Submit second feedback anonymously
    res2 = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": "Anonymous ticket 2",
            "description": "Description of anonymous ticket 2 with sufficient detail.",
            "is_anonymous": True,
        },
    )
    assert res2.status_code == 201

    # Reporter views list: should only see 1 ticket
    rep_list = await client.get("/api/v1/feedbacks", headers=reporter_headers)
    assert rep_list.status_code == 200
    rep_items = rep_list.json()["items"]
    assert len(rep_items) == 1
    assert rep_items[0]["title"] == "Reporter ticket 1"

    # Admin views list: should see both tickets
    adm_list = await client.get("/api/v1/feedbacks", headers=admin_headers)
    assert adm_list.status_code == 200
    adm_items = adm_list.json()["items"]
    assert len(adm_items) == 2
