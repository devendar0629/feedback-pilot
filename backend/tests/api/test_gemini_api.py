"""API and service tests for Gemini AI classification, retries, and fallback resilience."""
import pytest
from app.models.ai_analysis import AIAnalysisStatus
from app.services.ai_service import analyze_feedback


@pytest.mark.asyncio
async def test_ai_analysis_offline_mock_fallback(client, db_session, seed_data):
    """Test that when GEMINI_API_KEY is unset, the system falls back to mock analysis without error."""
    dept = seed_data["department"]
    cat = seed_data["category"]

    # Submit feedback
    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": "Severe production crash on login page",
            "description": "500 Internal Server error when submitting login credentials. Urgent bug!",
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    feedback_id = submit_res.json()["id"]

    # Trigger analysis directly
    ai_record = await analyze_feedback(db_session, feedback_id, force_retry=True)
    assert ai_record.status == AIAnalysisStatus.COMPLETED
    assert ai_record.urgency_score is not None
    assert ai_record.suggested_priority in ("critical", "high")
    assert ai_record.suggested_sentiment in ("negative", "neutral")
    assert ai_record.summary is not None
    assert ai_record.confidence_score is not None


@pytest.mark.asyncio
async def test_ai_disabled_setting_behavior(client, admin_headers, db_session, seed_data):
    """Test that when AI is disabled via settings, analysis is marked SKIPPED."""
    # 1. Disable AI via admin settings API
    disable_res = await client.post(
        "/api/v1/admin/ai-settings",
        headers=admin_headers,
        json={"ai_enabled": False},
    )
    assert disable_res.status_code == 200

    # 2. Submit new feedback
    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": "Feature request for dark mode",
            "description": "Please add a dark mode toggle to the dashboard settings.",
            "is_anonymous": True,
        },
    )
    feedback_id = submit_res.json()["id"]

    # 3. Analyze feedback
    ai_record = await analyze_feedback(db_session, feedback_id, force_retry=True)
    assert ai_record.status == AIAnalysisStatus.SKIPPED
    assert "disabled" in ai_record.error_message.lower()

    # Re-enable AI
    await client.post(
        "/api/v1/admin/ai-settings",
        headers=admin_headers,
        json={"ai_enabled": True},
    )


@pytest.mark.asyncio
async def test_apply_ai_suggestions_to_feedback(client, admin_headers, db_session, seed_data):
    """Test human staff applying AI recommendations to ticket."""
    dept = seed_data["department"]
    cat = seed_data["category"]

    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": "Critical memory leak",
            "description": "The worker memory spikes to 100% every 2 hours.",
            "is_anonymous": True,
        },
    )
    feedback_id = submit_res.json()["id"]

    # Run mock analysis
    await analyze_feedback(db_session, feedback_id, force_retry=True)

    # Apply AI suggestions via API
    apply_res = await client.post(
        f"/api/v1/feedbacks/{feedback_id}/apply-ai",
        headers=admin_headers,
        json={
            "apply_category": True,
            "apply_department": True,
            "apply_priority": True,
            "apply_sentiment": True,
        },
    )
    assert apply_res.status_code == 200
    applied_data = apply_res.json()
    assert applied_data["priority"] in ("critical", "high")
    assert applied_data["sentiment"] in ("negative", "neutral")
