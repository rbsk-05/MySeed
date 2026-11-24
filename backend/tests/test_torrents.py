def test_get_torrents_open_access(client):
    response = client.get("/api/torrents")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_settings_open_access(client):
    response = client.get("/api/settings")
    assert response.status_code == 200
    assert "download_dir" in response.json()

def test_update_settings(client):
    new_settings = {
        "download_dir": "C:\\Downloads",
        "max_active_downloads": 5,
        "max_download_speed": 1024,
        "max_upload_speed": 512
    }
    response = client.put("/api/settings", json=new_settings)
    assert response.status_code == 200
    data = response.json()
    assert data["max_active_downloads"] == 5
    assert data["max_download_speed"] == 1024

def test_torrent_lifecycle(client):
    # 1. Add magnet link
    magnet = "magnet:?xt=urn:btih:da39a3ee5e6b4b0d3255bfef95601890afd80709&dn=test"
    response = client.post("/api/torrents/magnet", data={"magnet_uri": magnet})
    assert response.status_code == 200
    torrent = response.json()
    torrent_id = torrent["id"]
    assert torrent["info_hash"] == "da39a3ee5e6b4b0d3255bfef95601890afd80709"

    # 2. Pause torrent
    pause_resp = client.post(f"/api/torrents/{torrent_id}/pause")
    assert pause_resp.status_code == 200
    assert pause_resp.json()["is_paused"] is True

    # 3. Resume torrent
    resume_resp = client.post(f"/api/torrents/{torrent_id}/resume")
    assert resume_resp.status_code == 200
    assert resume_resp.json()["is_paused"] is False

    # 4. Delete torrent
    del_resp = client.delete(f"/api/torrents/{torrent_id}")
    assert del_resp.status_code == 200
    del_data = del_resp.json()
    assert del_data["id"] == torrent_id

    # 5. Verify deleted from list
    all_torrents = client.get("/api/torrents").json()
    assert not any(t["id"] == torrent_id for t in all_torrents)

def test_bulk_delete_torrents(client):
    # Add two torrents
    magnet1 = "magnet:?xt=urn:btih:da39a3ee5e6b4b0d3255bfef95601890afd80709&dn=test1"
    magnet2 = "magnet:?xt=urn:btih:e3b0c44298fc1c149afbf4c8996fb92427ae41e4&dn=test2"
    t1 = client.post("/api/torrents/magnet", data={"magnet_uri": magnet1}).json()
    t2 = client.post("/api/torrents/magnet", data={"magnet_uri": magnet2}).json()

    # Bulk delete both
    resp = client.post("/api/torrents/bulk-delete", json={"ids": [t1["id"], t2["id"]], "delete_files": False})
    assert resp.status_code == 200
    data = resp.json()
    assert t1["id"] in data["deleted"]
    assert t2["id"] in data["deleted"]

    # Verify both deleted
    all_torrents = client.get("/api/torrents").json()
    assert not any(t["id"] in [t1["id"], t2["id"]] for t in all_torrents)
