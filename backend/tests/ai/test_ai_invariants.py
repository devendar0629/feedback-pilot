"""AI Synthetic Edge-Case & Invariant Validation Tests.

Validates that the FeedbackPilot triage pipeline, prompt sanitization,
schema boundary rules, and security isolation hold under diverse AI-generated
adversarial test scenarios.
"""
import pytest
from app.models.ai_analysis import AIAnalysisStatus
from app.services.ai_service import analyze_feedback
from app.services.ai_test_generator import load_benchmark_scenarios

scenarios = load_benchmark_scenarios()
scenario_map = {s.scenario_id: s for s in scenarios}


@pytest.mark.asyncio
@pytest.mark.parametrize("scenario", scenarios, ids=[s.scenario_id for s in scenarios])
async def test_ai_scenario_schema_bounds_invariant(scenario, client, db_session, seed_data):
    """Invariant 1: Urgency is strictly 0-100, sentiment and priority match allowed enums."""
    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": scenario.title,
            "description": scenario.description,
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    feedback_id = submit_res.json()["id"]

    ai_record = await analyze_feedback(db_session, feedback_id, force_retry=True)
    assert ai_record.status == AIAnalysisStatus.COMPLETED

    assert ai_record.urgency_score is not None
    assert 0 <= ai_record.urgency_score <= 100

    if ai_record.suggested_sentiment:
        assert ai_record.suggested_sentiment in scenario.expected_invariants.sentiment_valid_values

    if ai_record.suggested_priority:
        assert ai_record.suggested_priority in scenario.expected_invariants.priority_valid_values

    assert ai_record.summary is not None
    assert len(ai_record.summary) > 0


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scenario_id",
    [s.scenario_id for s in scenarios if s.expected_invariants.injection_refused],
)
async def test_prompt_injection_security_invariant(scenario_id, client, db_session, seed_data):
    """Invariant 2: Model does not execute adversarial commands or echo injection payloads as privileged output."""
    scenario = scenario_map[scenario_id]

    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": scenario.title,
            "description": scenario.description,
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    feedback_id = submit_res.json()["id"]

    ai_record = await analyze_feedback(db_session, feedback_id, force_retry=True)
    assert ai_record.status == AIAnalysisStatus.COMPLETED

    forbidden_echoes = ["<script>", "'; DROP TABLE", "You are now DAN"]
    for forbidden in forbidden_echoes:
        if forbidden in scenario.description:
            assert forbidden not in (ai_record.suggested_next_action or "")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scenario_id",
    [s.scenario_id for s in scenarios if s.expected_invariants.urgency_floor is not None],
)
async def test_urgency_floor_invariant(scenario_id, client, db_session, seed_data):
    """Invariant 3: High-urgency emergencies satisfy minimum urgency score threshold."""
    scenario = scenario_map[scenario_id]

    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": scenario.title,
            "description": scenario.description,
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    feedback_id = submit_res.json()["id"]

    ai_record = await analyze_feedback(db_session, feedback_id, force_retry=True)
    assert ai_record.status == AIAnalysisStatus.COMPLETED
    assert ai_record.urgency_score >= scenario.expected_invariants.urgency_floor


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "scenario_id",
    [s.scenario_id for s in scenarios if s.expected_invariants.urgency_ceiling is not None],
)
async def test_urgency_ceiling_invariant(scenario_id, client, db_session, seed_data):
    """Invariant 4: Benign feedback or praise does not exceed urgency ceiling threshold."""
    scenario = scenario_map[scenario_id]

    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": scenario.title,
            "description": scenario.description,
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    feedback_id = submit_res.json()["id"]

    ai_record = await analyze_feedback(db_session, feedback_id, force_retry=True)
    assert ai_record.status == AIAnalysisStatus.COMPLETED
    assert ai_record.urgency_score <= scenario.expected_invariants.urgency_ceiling


@pytest.mark.asyncio
async def test_public_tracking_invariant_with_adversarial_input(client, db_session, seed_data):
    """Invariant 5: Feedback with adversarial content generates valid dual-verification tracking credentials."""
    scenario = scenario_map.get("TC-AI-001", scenarios[0])

    submit_res = await client.post(
        "/api/v1/public/feedback",
        json={
            "title": scenario.title,
            "description": scenario.description,
            "is_anonymous": True,
        },
    )
    assert submit_res.status_code == 201
    data = submit_res.json()
    ref_num = data["reference_number"]
    secret = data["tracking_secret"]

    track_res = await client.post(
        "/api/v1/public/track",
        json={"reference_number": ref_num, "tracking_secret": secret},
    )
    assert track_res.status_code == 200
    track_data = track_res.json()
    assert track_data["reference_number"] == ref_num

    bad_track_res = await client.post(
        "/api/v1/public/track",
        json={"reference_number": ref_num, "tracking_secret": "invalid_wrong_secret_123"},
    )
    assert bad_track_res.status_code == 404
