def test_get_torrents_unauthorized(client):
    response = client.get("/api/torrents")
    assert response.status_code == 401

def test_get_torrents_authorized(client, token):
    response = client.get(
        "/api/torrents",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_settings_authorized(client, token):
    response = client.get(
        "/api/settings",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert "download_dir" in response.json()
