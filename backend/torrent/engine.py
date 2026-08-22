import libtorrent as lt
import os
import time
from backend.core.config import settings

class TorrentEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TorrentEngine, cls).__new__(cls)
            cls._instance.init_session()
        return cls._instance

    def init_session(self):
        p = lt.session_params()
        p.settings = {
            'enable_dht': True,
            'enable_lsd': True,
            'enable_upnp': True,
            'enable_natpmp': True
        }
        self.session = lt.session(p)
        
        # Ensure default download directory exists
        os.makedirs(settings.DEFAULT_DOWNLOAD_DIR, exist_ok=True)

        self.torrents = {}  # In-memory mapping from info_hash to torrent_handle
        
        # Start alert polling thread
        import threading
        self.stop_polling = False
        self.alert_thread = threading.Thread(target=self._poll_alerts, daemon=True)
        self.alert_thread.start()

    def _poll_alerts(self):
        while not self.stop_polling:
            alerts = self.session.pop_alerts()
            for alert in alerts:
                # We can log or process alerts here if needed
                pass
            time.sleep(1)

    def add_torrent_file(self, file_path: str, save_path: str = None) -> lt.torrent_handle:
        if not save_path:
            save_path = settings.DEFAULT_DOWNLOAD_DIR

        info = lt.torrent_info(file_path)
        params = {
            'save_path': save_path,
            'ti': info,
        }
        handle = self.session.add_torrent(params)
        info_hash = str(handle.info_hash())
        self.torrents[info_hash] = handle
        return handle

    def add_magnet_link(self, magnet_uri: str, save_path: str = None) -> lt.torrent_handle:
        if not save_path:
            save_path = settings.DEFAULT_DOWNLOAD_DIR

        params = lt.parse_magnet_uri(magnet_uri)
        params.save_path = save_path
        handle = self.session.add_torrent(params)
        info_hash = str(handle.info_hash())
        self.torrents[info_hash] = handle
        return handle

    def get_torrent(self, info_hash: str) -> lt.torrent_handle:
        return self.torrents.get(info_hash)

    def pause_torrent(self, info_hash: str):
        handle = self.get_torrent(info_hash)
        if handle:
            handle.pause()

    def resume_torrent(self, info_hash: str):
        handle = self.get_torrent(info_hash)
        if handle:
            handle.resume()

    def remove_torrent(self, info_hash: str, delete_files: bool = False):
        handle = self.get_torrent(info_hash)
        if handle:
            options = lt.delete_files if delete_files else 0
            self.session.remove_torrent(handle, options)
            del self.torrents[info_hash]

    def get_status(self, info_hash: str):
        handle = self.get_torrent(info_hash)
        if not handle:
            return None
        
        status = handle.status()
        state_str = ['queued', 'checking', 'downloading metadata',
                     'downloading', 'finished', 'seeding', 'allocating',
                     'checking fastresume'][status.state]
                     
        if handle.is_paused() and status.state != lt.torrent_status.finished:
            state_str = 'paused'
            
        return {
            "name": status.name,
            "progress": status.progress * 100,
            "download_speed": status.download_rate,
            "upload_speed": status.upload_rate,
            "eta": 0 if status.download_rate == 0 else int((status.total_wanted - status.total_wanted_done) / status.download_rate),
            "peers": status.num_peers,
            "seeds": status.num_seeds,
            "downloaded": status.total_done,
            "uploaded": status.total_payload_upload,
            "state": state_str,
            "size": status.total_wanted,
            "error": status.errc.message() if status.errc else ""
        }

torrent_engine = TorrentEngine()
