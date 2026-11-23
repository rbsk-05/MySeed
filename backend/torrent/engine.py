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
            options = self.session.delete_files if delete_files else 0
            self.session.remove_torrent(handle, options)
            if info_hash in self.torrents:
                del self.torrents[info_hash]

    def get_status(self, info_hash: str):
        handle = self.get_torrent(info_hash)
        if not handle:
            return None
        
        try:
            status = handle.status()
            state_str = ['queued', 'checking', 'downloading metadata',
                         'downloading', 'finished', 'seeding', 'allocating',
                         'checking fastresume'][status.state]
                         
            if handle.is_paused() and status.state != lt.torrent_status.finished:
                state_str = 'paused'
                
            total_wanted = status.total_wanted
            total_done = status.total_wanted_done
            dl_rate = status.download_rate
            
            eta = 0
            if dl_rate > 0 and total_wanted > total_done:
                eta = int((total_wanted - total_done) / dl_rate)

            # Error message if any (only when errc.value != 0, ignoring success code 0)
            err_msg = ""
            if hasattr(status, 'errc') and status.errc:
                try:
                    err_val = status.errc.value() if hasattr(status.errc, 'value') else 0
                    if err_val != 0:
                        raw_msg = status.errc.message() if hasattr(status.errc, 'message') else str(status.errc)
                        if raw_msg and "completed successfully" not in raw_msg.lower():
                            err_msg = raw_msg
                except Exception:
                    pass

            return {
                "name": status.name,
                "progress": round(status.progress * 100, 2),
                "download_speed": dl_rate,
                "upload_speed": status.upload_rate,
                "eta": eta,
                "peers": status.num_peers,
                "seeds": status.num_seeds,
                "downloaded": status.total_done,
                "uploaded": status.total_payload_upload,
                "state": state_str,
                "is_paused": handle.is_paused(),
                "size": total_wanted,
                "error": err_msg
            }
        except Exception:
            return None

torrent_engine = TorrentEngine()
