def test_get_torrents_open_access(client):
    response = client.get("/api/torrents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_settings_open_access(client):
    response = client.get("/api/settings")
    assert response.status_code == 200
    assert "download_dir" in response.json()
