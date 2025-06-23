import requests

def test_classify_case():
    url = "http://localhost:8000/classify-case"
    payload = {
        "description": "Unauthorized transaction",
        "email": "test@example.com",
        "priority": "High"
    }
    response = requests.post(url, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "category" in data and "status" in data

def test_resolve_case():
    url = "http://localhost:8000/cases/1/resolve"
    response = requests.patch(url)
    assert response.status_code in [200, 404]  # 404 if case not found