"""API integration tests for public comments vs private internal notes privacy isolation."""
import pytest


@pytest.mark.asyncio
async def test_comments_privacy_separation(
    client, admin_headers, agent_headers, reporter_headers
):
    """Ensure internal staff notes are visible to agents/admins but strictly hidden from reporters and public tracking."""
    # 1. Reporter submits feedback
    submit_res = await client.post(
        "/api/v1/public/feedback",
        headers=reporter_headers,
        json={
            "title": "Account billing discrepancy",
            "description": "I was charged twice on my invoice this month.",
            "is_anonymous": False,
        },
    )
    assert submit_res.status_code == 201
    feedback_id = submit_res.json()["id"]
    ref_num = submit_res.json()["reference_number"]
    tracking_secret = submit_res.json()["tracking_secret"]

    # 2. Agent adds a private internal note
    internal_res = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/comments",
        headers=agent_headers,
        json={
            "content": "INTERNAL NOTE: Checked Stripe log. Charge #2 failed on gateway, will auto-reconcile.",
            "is_internal": True,
        },
    )
    assert internal_res.status_code == 201

    # 3. Agent adds a public response
    public_res = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/comments",
        headers=agent_headers,
        json={
            "content": "PUBLIC RESPONSE: We have investigated and the duplicate pending charge will drop within 24 hours.",
            "is_internal": False,
        },
    )
    assert public_res.status_code == 201

    # 4. Reporter tries to post an internal note -> MUST BE FORBIDDEN (403)
    rep_try_internal = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/comments",
        headers=reporter_headers,
        json={"content": "Reporter trying to create internal note", "is_internal": True},
    )
    assert rep_try_internal.status_code == 403

    # 5. Reporter fetches feedback detail: MUST ONLY SEE the public comment (1 comment), NOT internal note
    rep_detail = await client.get(f"/api/v1/feedbacks/{feedback_id}", headers=reporter_headers)
    assert rep_detail.status_code == 200
    comments = rep_detail.json()["comments"]
    assert len(comments) == 1
    assert comments[0]["is_internal"] is False
    assert "PUBLIC RESPONSE" in comments[0]["content"]

    # 6. Public tracking lookup: MUST ONLY SEE the public comment
    track_res = await client.post(
        "/api/v1/public/track",
        json={"reference_number": ref_num, "tracking_secret": tracking_secret},
    )
    assert track_res.status_code == 200
    public_comments = track_res.json()["public_comments"]
    assert len(public_comments) == 1
    assert public_comments[0]["is_internal"] is False
    assert "PUBLIC RESPONSE" in public_comments[0]["content"]

    # 7. Admin fetches feedback detail: MUST SEE BOTH comments (2 comments)
    admin_detail = await client.get(f"/api/v1/feedbacks/{feedback_id}", headers=admin_headers)
    assert admin_detail.status_code == 200
    admin_comments = admin_detail.json()["comments"]
    assert len(admin_comments) == 2
    assert any(c["is_internal"] is True for c in admin_comments)
