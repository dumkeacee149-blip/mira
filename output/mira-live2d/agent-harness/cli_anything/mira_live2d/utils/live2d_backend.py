from __future__ import annotations

import ctypes
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any


DEFAULT_LIVE2D_LAUNCHER = Path(r"F:\Program Files\Live2D Cubism 5.3\CubismEditor5.bat")
DEFAULT_JAB_SWITCH = Path(r"F:\Program Files\Live2D Cubism 5.3\app\jre\bin\jabswitch.exe")
DEFAULT_WINDOWS_ACCESS_BRIDGE_DLL = Path(
    r"F:\Program Files\Live2D Cubism 5.3\app\jre\bin\windowsaccessbridge-64.dll"
)
LIVE2D_WINDOW_TOKEN = "Live2D Cubism Editor"
EXPORT_AS_MOC3_MENU_NAME = "\u5bfc\u51fa\u4e3amoc3\u6587\u4ef6..."
INFO_DIALOG_TITLE = "\u4fe1\u606f\u5bf9\u8bdd\u6846"


def _powershell_launch_command(target_path: Path | None = None) -> list[str]:
    power_shell_command = f"Start-Process -FilePath '{DEFAULT_LIVE2D_LAUNCHER}'"
    if target_path is not None:
        escaped_path = str(target_path).replace("'", "''")
        power_shell_command = f"{power_shell_command} -ArgumentList @('{escaped_path}')"
    return [
        "powershell",
        "-NoProfile",
        "-Command",
        power_shell_command,
    ]


def launch_live2d(target_path: Path | None = None, dry_run: bool = False) -> dict[str, Any]:
    command = _powershell_launch_command(target_path)

    if dry_run:
        return {"action": "launch_live2d", "command": command, "dry_run": True}

    subprocess.Popen(command)
    return {"action": "launch_live2d", "command": command, "dry_run": False}


def enable_live2d_access_bridge(dry_run: bool = False) -> dict[str, Any]:
    command = [str(DEFAULT_JAB_SWITCH), "/enable"]
    if dry_run:
        return {"action": "enable_live2d_access_bridge", "command": command, "dry_run": True}

    result = subprocess.run(command, check=True, capture_output=True, text=True)
    return {
        "action": "enable_live2d_access_bridge",
        "command": command,
        "dry_run": False,
        "stdout": result.stdout.strip(),
    }


def desktop_directory() -> Path:
    return Path.home() / "Desktop"


def runtime_search_roots(target_path: Path) -> list[Path]:
    roots: list[Path] = []
    for root in (target_path.parent, desktop_directory()):
        if root not in roots:
            roots.append(root)
    return roots


def collect_runtime_artifacts(search_root: Path, stem: str) -> list[Path]:
    atlas_dirs = sorted(search_root.glob(f"{stem}.*"))
    files = [
        search_root / f"{stem}.moc3",
        search_root / f"{stem}.model3.json",
        search_root / f"{stem}.cdi3.json",
        search_root / f"{stem}.physics3.json",
        search_root / f"{stem}.userdata3.json",
    ]

    artifacts = [path for path in files if path.exists()]
    artifacts.extend(path for path in atlas_dirs if path.is_dir())
    return sorted(artifacts, key=lambda path: path.name.lower())


def collect_runtime_artifacts_from_roots(search_roots: list[Path], stem: str) -> list[Path]:
    for search_root in search_roots:
        artifacts = collect_runtime_artifacts(search_root, stem)
        if artifacts:
            return artifacts
    return []


def stage_runtime_artifacts(artifacts: list[Path], export_root: Path, stem: str) -> list[Path]:
    bundle_root = export_root / stem
    bundle_root.mkdir(parents=True, exist_ok=True)
    staged_paths: list[Path] = []

    for source_path in artifacts:
        destination_path = bundle_root / source_path.name
        if source_path.is_dir():
            if destination_path.exists():
                shutil.rmtree(destination_path)
            shutil.copytree(source_path, destination_path)
        else:
            shutil.copy2(source_path, destination_path)
        staged_paths.append(destination_path)

    return staged_paths


def clear_runtime_artifacts(search_root: Path, stem: str) -> None:
    for artifact_path in collect_runtime_artifacts(search_root, stem):
        if artifact_path.is_dir():
            shutil.rmtree(artifact_path)
        else:
            artifact_path.unlink()


def clear_runtime_artifacts_from_roots(search_roots: list[Path], stem: str) -> None:
    for search_root in search_roots:
        clear_runtime_artifacts(search_root, stem)


def _window_title(hwnd: int) -> str:
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    get_window_text_length = user32.GetWindowTextLengthW
    get_window_text = user32.GetWindowTextW
    text_length = get_window_text_length(hwnd)
    text_buffer = ctypes.create_unicode_buffer(text_length + 1)
    get_window_text(hwnd, text_buffer, text_length + 1)
    return text_buffer.value


def _wait_for_cubism_window(timeout: int = 60) -> int:
    from pywinauto.findwindows import find_windows

    deadline = time.time() + timeout
    while time.time() < deadline:
        cubism_window_handle = _find_cubism_window()
        if cubism_window_handle is not None:
            return cubism_window_handle
        time.sleep(1)

    raise TimeoutError("Timed out while waiting for the Live2D Cubism window.")


def _find_cubism_window() -> int | None:
    from pywinauto.findwindows import find_windows

    handles = find_windows(title_re=f".*{LIVE2D_WINDOW_TOKEN}.*")
    return handles[0] if handles else None


def _connect_cubism(hwnd: int):
    from pyjab.jabdriver import JABDriver

    try:
        return JABDriver(
            hwnd=hwnd,
            bridge_dll=str(DEFAULT_WINDOWS_ACCESS_BRIDGE_DLL),
            timeout=20,
        )
    except RuntimeError as error:
        if "not Java Window" not in str(error):
            raise
        _dismiss_info_dialogs()
        return JABDriver(
            hwnd=hwnd,
            bridge_dll=str(DEFAULT_WINDOWS_ACCESS_BRIDGE_DLL),
            timeout=20,
        )


def _wait_for_loaded_project(hwnd: int, target_path: Path, timeout: int = 30) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        if target_path.name in _window_title(hwnd):
            return
        time.sleep(1)

    raise TimeoutError(f"Timed out while waiting for Cubism to open '{target_path.name}'.")


def _dismiss_info_dialogs() -> None:
    from pywinauto.findwindows import find_windows

    user32 = ctypes.WinDLL("user32", use_last_error=True)
    wm_keydown = 0x0100
    wm_keyup = 0x0101
    vk_return = 0x0D
    for dialog_handle in find_windows(title=INFO_DIALOG_TITLE):
        user32.ShowWindow(dialog_handle, 9)
        user32.SetForegroundWindow(dialog_handle)
        user32.PostMessageW(dialog_handle, wm_keydown, vk_return, 0)
        user32.PostMessageW(dialog_handle, wm_keyup, vk_return, 0)
        time.sleep(0.5)


def _open_target_project(driver, hwnd: int, target_path: Path) -> None:
    if target_path.name in _window_title(hwnd):
        return

    recent_project_menu_item = driver.find_element_by_name(target_path.name)
    recent_project_menu_item.click()
    _wait_for_loaded_project(hwnd, target_path)


def _wait_for_runtime_export(
    search_roots: list[Path],
    stem: str,
    started_at: float,
    timeout: int = 60,
) -> list[Path]:
    deadline = time.time() + timeout
    while time.time() < deadline:
        for search_root in search_roots:
            artifacts = collect_runtime_artifacts(search_root, stem)
            if artifacts and any(path.stat().st_mtime >= started_at for path in artifacts):
                return artifacts
        time.sleep(1)

    raise TimeoutError(f"Timed out while waiting for runtime files for '{stem}' to be exported.")


def export_runtime_bundle(
    target_path: Path,
    export_root: Path,
    dry_run: bool = False,
) -> dict[str, Any]:
    if dry_run:
        return {
            "action": "export_runtime_bundle",
            "target_path": str(target_path),
            "export_root": str(export_root),
            "dry_run": True,
        }

    enable_live2d_access_bridge(dry_run=False)
    cubism_window_handle = _find_cubism_window()
    if cubism_window_handle is None:
        launch_live2d(target_path=target_path, dry_run=False)
        cubism_window_handle = _wait_for_cubism_window()
    cubism_driver = _connect_cubism(cubism_window_handle)
    _open_target_project(cubism_driver, cubism_window_handle, target_path)

    search_roots = runtime_search_roots(target_path)
    clear_runtime_artifacts_from_roots(search_roots, target_path.stem)
    export_started_at = time.time()
    export_menu_item = cubism_driver.find_element_by_name(EXPORT_AS_MOC3_MENU_NAME)
    export_menu_item.click()

    artifacts = _wait_for_runtime_export(search_roots, target_path.stem, export_started_at)
    staged_paths = stage_runtime_artifacts(artifacts, export_root, target_path.stem)
    _dismiss_info_dialogs()

    return {
        "action": "export_runtime_bundle",
        "target_path": str(target_path),
        "export_root": str(export_root),
        "dry_run": False,
        "runtime_artifacts": [str(path) for path in artifacts],
        "staged_artifacts": [str(path) for path in staged_paths],
        "model3_json": str((export_root / target_path.stem / f"{target_path.stem}.model3.json")),
    }
