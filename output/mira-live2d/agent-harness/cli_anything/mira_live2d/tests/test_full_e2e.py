from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest


@pytest.mark.skipif(shutil.which("cli-anything-mira-live2d") is None, reason="entrypoint not installed")
def test_installed_cli_bootstrap_and_status(tmp_path: Path) -> None:
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"

    bootstrap = subprocess.run(
        [
            "cli-anything-mira-live2d",
            "--project-dir",
            str(tmp_path),
            "--json",
            "bootstrap",
        ],
        check=True,
        capture_output=True,
        text=True,
        env=env,
    )
    status_result = subprocess.run(
        [
            "cli-anything-mira-live2d",
            "--project-dir",
            str(tmp_path),
            "--json",
            "status",
        ],
        check=True,
        capture_output=True,
        text=True,
        env=env,
    )

    bootstrap_payload = json.loads(bootstrap.stdout)
    status_payload = json.loads(status_result.stdout)

    assert bootstrap_payload["action"] == "bootstrap"
    assert status_payload["manifest_exists"] is True
