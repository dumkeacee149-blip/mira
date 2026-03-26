from __future__ import annotations

import subprocess
import time
from pathlib import Path
from typing import Any


DEFAULT_PHOTOSHOP_EXE = Path(r"C:\Program Files\Adobe\Adobe Photoshop 2022\Photoshop.exe")


def _is_busy_retryable(error: subprocess.CalledProcessError) -> bool:
    output = f"{error.stdout}\n{error.stderr}"
    return "application is busy" in output.lower() or "rpc_e_servercall_retrylater" in output.lower()


def launch_photoshop(target_path: Path | None = None, dry_run: bool = False) -> dict[str, Any]:
    command = [str(DEFAULT_PHOTOSHOP_EXE)]
    if target_path is not None:
        command.append(str(target_path))

    if dry_run:
        return {"action": "launch_photoshop", "command": command, "dry_run": True}

    subprocess.Popen(command)
    return {"action": "launch_photoshop", "command": command, "dry_run": False}


def create_psd_template(
    harness_root: Path,
    output_psd: Path,
    reference_images: list[Path] | None = None,
    document_name: str = "Mira_Live2D_Template",
    width: int = 6144,
    height: int = 8192,
    resolution: int = 300,
    keep_open: bool = False,
    dry_run: bool = False,
) -> dict[str, Any]:
    wrapper = harness_root / "scripts" / "invoke_photoshop_script.ps1"
    jsx_path = harness_root / "scripts" / "photoshop" / "create_mira_live2d_template.jsx"

    command = [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(wrapper),
        "-JsxPath",
        str(jsx_path),
        "-OutputPsd",
        str(output_psd),
        "-DocumentName",
        document_name,
        "-Width",
        str(width),
        "-Height",
        str(height),
        "-Resolution",
        str(resolution),
    ]

    if reference_images:
        command.extend(
            [
                "-ReferenceImagesJoined",
                "|".join(str(reference_image) for reference_image in reference_images),
            ]
        )

    if keep_open:
        command.append("-KeepOpen")

    if dry_run:
        return {"action": "create_psd_template", "command": command, "dry_run": True}

    last_error: subprocess.CalledProcessError | None = None
    for attempt in range(1, 4):
        try:
            completed = subprocess.run(
                command,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                check=True,
            )
            return {
                "action": "create_psd_template",
                "command": command,
                "stdout": completed.stdout.strip(),
                "stderr": completed.stderr.strip(),
                "output_psd": str(output_psd),
                "dry_run": False,
            }
        except subprocess.CalledProcessError as error:
            last_error = error
            if attempt == 3 or not _is_busy_retryable(error):
                raise

            time.sleep(3)

    return {
        "action": "create_psd_template",
        "command": command,
        "stdout": (last_error.stdout or "").strip() if last_error else "",
        "stderr": (last_error.stderr or "").strip() if last_error else "",
        "output_psd": str(output_psd),
        "dry_run": False,
    }
