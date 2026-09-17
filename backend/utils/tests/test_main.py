"""
Unit + integration tests for the case classifier API.

Run with:  pytest backend/utils/tests/test_main.py -v
(from the backend/ directory, or with backend/ on PYTHONPATH)

These tests spin up the FastAPI app in-process (via TestClient) against an
isolated in-memory SQLite database, and monkeypatch the Anthropic client so
the suite runs fast, free, and offline. No ANTHROPIC_API_KEY is required.
"""
import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Make `backend/` importable regardless of where pytest is invoked from.
BACKEND_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key-not-used")

from database import Base  # noqa: E402
import main as main_module  # noqa: E402
from models import Case  # noqa: E402

# ---- Isolated in-memory test database -------------------------------------

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=TEST_ENGINE, autocommit=False, autoflush=False)
Base.metadata.create_all(bind=TEST_ENGINE)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


main_module.app.dependency_overrides[main_module.get_db] = override_get_db
client = TestClient(main_module.app)


class _FakeTextBlock:
    def __init__(self, text):
        self.text = text


class _FakeAnthropicResponse:
    def __init__(self, text):
        self.content = [_FakeTextBlock(text)]


@pytest.fixture(autouse=True)
def fake_claude(monkeypatch):
    """Stub out the real Claude API call so tests don't need network/billing."""

    def _fake_create(*args, **kwargs):
        description = kwargs["messages"][0]["content"].lower()
        if "unauthorized" in description or "fraud" in description:
            label = "Fraud"
        elif "login" in description or "log in" in description or "password" in description or "access" in description:
            label = "Account Access"
        elif "verify" in description or "identity" in description:
            label = "Verification"
        else:
            label = "General Inquiry"
        return _FakeAnthropicResponse(label)

    monkeypatch.setattr(main_module.client.messages, "create", _fake_create)
    yield
    # Reset the table between tests so assertions don't leak across cases.
    with TEST_ENGINE.connect() as conn:
        conn.execute(Case.__table__.delete())
        conn.commit()


# ---- Tests ------------------------------------------------------------------

def test_root_health_check():
    res = client.get("/")
    assert res.status_code == 200
    assert "running" in res.json()["message"].lower()


def test_classify_case_fraud_is_auto_resolved():
    res = client.post(
        "/classify-case",
        json={"description": "Unauthorized transaction on my account", "email": "test@example.com", "priority": "High"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "Fraud"
    assert data["status"] == "Resolved"


def test_classify_case_account_access_is_pending():
    res = client.post(
        "/classify-case",
        json={"description": "I can't log in, password reset isn't working", "email": "test@example.com", "priority": "Medium"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["category"] == "Account Access"
    assert data["status"] == "Pending"


def test_classify_case_rejects_invalid_priority():
    res = client.post(
        "/classify-case",
        json={"description": "General question", "email": "test@example.com", "priority": "Urgent"},
    )
    assert res.status_code == 422  # pydantic validation error


def test_classify_case_rejects_invalid_email():
    res = client.post(
        "/classify-case",
        json={"description": "General question", "email": "not-an-email", "priority": "Low"},
    )
    assert res.status_code == 422


def test_full_case_lifecycle_resolve():
    create_res = client.post(
        "/classify-case",
        json={"description": "I can't log in", "email": "user@example.com", "priority": "Medium"},
    )
    assert create_res.status_code == 200

    list_res = client.get("/cases")
    assert list_res.status_code == 200
    cases = list_res.json()
    assert len(cases) == 1
    case_id = cases[0]["id"]

    resolve_res = client.patch(f"/cases/{case_id}/resolve")
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "Resolved"

    # Resolving twice should fail
    second_resolve = client.patch(f"/cases/{case_id}/resolve")
    assert second_resolve.status_code == 400


def test_escalate_case_increments_level_and_caps_at_two():
    create_res = client.post(
        "/classify-case",
        json={"description": "I can't log in", "email": "user@example.com", "priority": "High"},
    )
    case_id = create_res.json() and client.get("/cases").json()[0]["id"]

    r1 = client.patch(f"/cases/{case_id}/escalate")
    assert r1.status_code == 200
    assert r1.json()["escalation_level"] == 1

    r2 = client.patch(f"/cases/{case_id}/escalate")
    assert r2.json()["escalation_level"] == 2

    r3 = client.patch(f"/cases/{case_id}/escalate")
    assert r3.status_code == 400


def test_resolve_nonexistent_case_returns_404():
    res = client.patch("/cases/999999/resolve")
    assert res.status_code == 404


def test_cases_stats_endpoint_shape():
    client.post(
        "/classify-case",
        json={"description": "Unauthorized transaction", "email": "a@example.com", "priority": "High"},
    )
    res = client.get("/cases/stats")
    assert res.status_code == 200
    data = res.json()
    for key in ("total", "resolved", "pending", "byCategory", "byPriority", "daily"):
        assert key in data
