"""API integration tests for public tracking and dual verification."""
import pytest


@pytest.mark.asyncio
async def test_tracking_success_and_failure(client):
    """Test tracking with correct credentials succeeds and invalid credentials fail."""
    # 1. Submit ticket
    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": "Water leakage in cafeteria",
            "description": "Pipe leaking water near table 4 in main cafeteria.",
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    data = submit_res.json()
    ref = data["reference_number"]
    secret = data["tracking_secret"]

    # 2. Track with correct reference and secret
    track_res = await client.post(
        "/api/v1/public/track",
        json={"reference_number": ref, "tracking_secret": secret},
    )
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["reference_number"] == ref
    assert track_data["title"] == "Water leakage in cafeteria"
    assert track_data["status"] == "submitted"
    assert len(track_data["timeline"]) >= 1

    # 3. Track with WRONG secret -> Must fail
    bad_res = await client.post(
        "/api/v1/public/track",
        json={"reference_number": ref, "tracking_secret": "tr_invalid_secret_key_123"},
    )
    assert bad_res.status_code == 404
    assert "Invalid reference number or tracking secret" in bad_res.json()["detail"]

    # 4. Track with non-existent reference
    bad_ref_res = await client.post(
        "/api/v1/public/track",
        json={"reference_number": "FP-9999-XXXXXX", "tracking_secret": secret},
    )
    assert bad_ref_res.status_code == 404
