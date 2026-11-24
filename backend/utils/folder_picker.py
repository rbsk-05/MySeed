import sys
import os
import ctypes
from ctypes import wintypes

def pick_folder(initial_dir: str = None) -> str:
    """
    Opens native Windows folder selection dialog using shell32.SHBrowseForFolderW.
    Direct Win32 Shell API: 100% native, foreground focused, zero external process dependencies.
    """
    if sys.platform != "win32":
        return None

    init_path = os.path.normpath(initial_dir) if initial_dir and os.path.exists(initial_dir) else ""

    try:
        ole32 = ctypes.windll.ole32
        shell32 = ctypes.windll.shell32
        user32 = ctypes.windll.user32

        ole32.CoInitialize(None)

        BIF_RETURNONLYFSDIRS = 0x00000001
        BIF_NEWDIALOGSTYLE = 0x00000040

        BFFM_INITIALIZED = 1
        BFFM_SETSELECTIONW = 0x0400 + 103

        BFFCALLBACK = ctypes.WINFUNCTYPE(ctypes.c_int, wintypes.HWND, wintypes.UINT, wintypes.LPARAM, wintypes.LPARAM)

        def callback(hwnd, uMsg, lParam, lpData):
            if uMsg == BFFM_INITIALIZED:
                if init_path:
                    user32.SendMessageW(hwnd, BFFM_SETSELECTIONW, 1, init_path)
                user32.SetForegroundWindow(hwnd)
            return 0

        cb_func = BFFCALLBACK(callback)

        class BROWSEINFOW(ctypes.Structure):
            _fields_ = [
                ('hwndOwner', wintypes.HWND),
                ('pidlRoot', ctypes.c_void_p),
                ('pszDisplayName', wintypes.LPWSTR),
                ('lpszTitle', wintypes.LPCWSTR),
                ('ulFlags', wintypes.UINT),
                ('lpfn', BFFCALLBACK),
                ('lParam', wintypes.LPARAM),
                ('iImage', ctypes.c_int)
            ]

        display_name = ctypes.create_unicode_buffer(260)
        bi = BROWSEINFOW()
        bi.hwndOwner = user32.GetForegroundWindow()
        bi.pidlRoot = None
        bi.pszDisplayName = ctypes.cast(display_name, wintypes.LPWSTR)
        bi.lpszTitle = "Select Torrent Download Directory"
        bi.ulFlags = BIF_RETURNONLYFSDIRS | BIF_NEWDIALOGSTYLE
        bi.lpfn = cb_func
        bi.lParam = 0

        pidl = shell32.SHBrowseForFolderW(ctypes.byref(bi))
        if not pidl:
            ole32.CoUninitialize()
            return None

        path_buff = ctypes.create_unicode_buffer(260)
        success = shell32.SHGetPathFromIDListW(pidl, path_buff)
        ole32.CoTaskMemFree(pidl)
        ole32.CoUninitialize()

        if success and path_buff.value:
            return os.path.normpath(path_buff.value)
    except Exception as e:
        print(f"Error in SHBrowseForFolderW: {e}", file=sys.stderr)

    return None

if __name__ == "__main__":
    init = sys.argv[1] if len(sys.argv) > 1 else None
    res = pick_folder(init)
    if res:
        print(res)
