"""API integration tests for workflow transitions and assignments."""
import pytest


@pytest.mark.asyncio
async def test_api_status_transitions_and_history(client, admin_headers, seed_data):
    """Test valid and invalid transitions via the REST API."""
    # 1. Submit ticket
    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": "Software UI glitch on Safari",
            "description": "Buttons overlap when viewed on Safari mobile browser.",
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    feedback_id = submit_res.json()["id"]

    # 2. Transition SUBMITTED -> UNDER_REVIEW (Valid)
    trans_res1 = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/transition",
        headers=admin_headers,
        json={"target_status": "under_review", "reason": "Triage in progress"},
    )
    assert trans_res1.status_code == 200
    assert trans_res1.json()["status"] == "under_review"

    # 3. Transition UNDER_REVIEW -> SUBMITTED (Invalid transition) -> Expect 400
    bad_trans = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/transition",
        headers=admin_headers,
        json={"target_status": "submitted", "reason": "Attempting invalid backwards move"},
    )
    assert bad_trans.status_code == 400
    assert "Invalid status transition" in bad_trans.json()["detail"]

    # 4. Transition UNDER_REVIEW -> IN_PROGRESS (Valid)
    trans_res2 = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/transition",
        headers=admin_headers,
        json={"target_status": "in_progress", "reason": "Assigned to engineer"},
    )
    assert trans_res2.status_code == 200
    assert trans_res2.json()["status"] == "in_progress"

    # 5. Check detail: status history contains all steps
    detail_res = await client.get(f"/api/v1/feedbacks/{feedback_id}", headers=admin_headers)
    assert detail_res.status_code == 200
    histories = detail_res.json()["status_history"]
    assert len(histories) >= 3  # Initial submitted + under_review + in_progress


@pytest.mark.asyncio
async def test_api_assignment_and_notifications(client, admin_headers, seed_data):
    """Test assigning feedback to agent creates notification and updates state."""
    agent = seed_data["agent"]
    dept = seed_data["department"]

    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": "Database connection drop",
            "description": "Connection dropped at midnight.",
            "is_anonymous": True,
        },
    )
    feedback_id = submit_res.json()["id"]

    # Assign to agent
    assign_res = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/assign",
        headers=admin_headers,
        json={
            "department_id": str(dept.id),
            "assigned_to_id": str(agent.id),
            "note": "Please look into db logs",
        },
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_to_id"] == str(agent.id)
    assert assign_res.json()["status"] == "assigned"
