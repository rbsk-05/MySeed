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

    def apply_session_settings(self, max_active_downloads: int = 3, max_download_speed: int = 0, max_upload_speed: int = 0):
        try:
            active_dl = max(1, max_active_downloads) if max_active_downloads else 3
            settings_dict = {
                'active_downloads': active_dl,
                'active_limit': max(active_dl * 2, 6),
                'download_rate_limit': int(max_download_speed * 1024) if max_download_speed and max_download_speed > 0 else 0,
                'upload_rate_limit': int(max_upload_speed * 1024) if max_upload_speed and max_upload_speed > 0 else 0,
            }
            self.session.apply_settings(settings_dict)
        except Exception:
            pass

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
            try:
                handle.unset_flags(lt.torrent_flags.auto_managed)
            except Exception:
                pass
            handle.pause()

    def resume_torrent(self, info_hash: str):
        handle = self.get_torrent(info_hash)
        if handle:
            try:
                handle.set_flags(lt.torrent_flags.auto_managed)
            except Exception:
                pass
            handle.resume()

    def remove_torrent(self, info_hash: str, delete_files: bool = False):
        handle = self.get_torrent(info_hash)
        if handle:
            file_paths = []
            if delete_files:
                try:
                    ti = handle.torrent_file()
                    sp = handle.status().save_path
                    if ti and sp:
                        for i in range(ti.num_files()):
                            file_paths.append(os.path.join(sp, ti.files().file_path(i)))
                except Exception:
                    pass
            options = (self.session.delete_files | getattr(self.session, 'delete_partfile', 2)) if delete_files else 0
            self.session.remove_torrent(handle, options)
            if info_hash in self.torrents:
                del self.torrents[info_hash]
            
            # Ensure physical removal of any remaining files on disk
            if delete_files and file_paths:
                for fp in file_paths:
                    try:
                        if os.path.isfile(fp):
                            os.remove(fp)
                        elif os.path.isdir(fp):
                            import shutil
                            shutil.rmtree(fp, ignore_errors=True)
                    except Exception:
                        pass

    def get_status(self, info_hash: str):
        handle = self.get_torrent(info_hash)
        if not handle:
            return None
        
        try:
            status = handle.status()
            state_str = ['queued', 'checking', 'downloading metadata',
                         'downloading', 'finished', 'seeding', 'allocating',
                         'checking fastresume'][status.state]
                         
            is_finished = (status.state == lt.torrent_status.finished or status.state == lt.torrent_status.seeding)
            is_auto_managed = bool(status.auto_managed)
            is_paused_flag = bool(status.paused)

            # Check active downloads limit from session settings
            try:
                active_dl = self.session.get_settings().get('active_downloads', 3)
            except Exception:
                active_dl = 3

            is_user_paused = False
            is_queued = False

            if not is_finished:
                if is_paused_flag:
                    if is_auto_managed:
                        is_queued = True
                        state_str = 'queued'
                    else:
                        is_user_paused = True
                        state_str = 'paused'
                elif is_auto_managed and active_dl > 0 and status.queue_position >= active_dl:
                    is_queued = True
                    state_str = 'queued'
                
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
                "is_paused": is_user_paused,
                "is_queued": is_queued,
                "queue_position": status.queue_position,
                "size": total_wanted,
                "error": err_msg
            }
        except Exception:
            return None

torrent_engine = TorrentEngine()
