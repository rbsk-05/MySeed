export interface Torrent {
  id: number;
  info_hash: string;
  name: string;
  size: number;
  save_path: string;
  added_date: string;
  status: string;
  is_paused: boolean;
  progress: number;
  download_speed: number;
  upload_speed: number;
  eta: number;
  peers: number;
  seeds: number;
  downloaded: number;
  uploaded: number;
  state: string;
  error?: string;
}
