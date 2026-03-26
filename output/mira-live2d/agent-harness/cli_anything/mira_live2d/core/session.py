from __future__ import annotations

import json
from pathlib import Path
from typing import Any


STATE_FILE_NAME = ".mira-live2d-session.json"


def state_file(project_dir: Path) -> Path:
    return project_dir / STATE_FILE_NAME


def load_state(project_dir: Path) -> dict[str, Any]:
    path = state_file(project_dir)
    if not path.exists():
        return {"undo": [], "redo": []}

    return json.loads(path.read_text(encoding="utf-8"))


def save_state(project_dir: Path, state: dict[str, Any]) -> None:
    project_dir.mkdir(parents=True, exist_ok=True)
    state_file(project_dir).write_text(
        json.dumps(state, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def record_action(project_dir: Path, action: dict[str, Any]) -> None:
    state = load_state(project_dir)
    state.setdefault("undo", []).append(action)
    state["redo"] = []
    save_state(project_dir, state)


def pop_undo(project_dir: Path) -> dict[str, Any] | None:
    state = load_state(project_dir)
    undo_stack = state.setdefault("undo", [])
    if not undo_stack:
        return None

    action = undo_stack.pop()
    state.setdefault("redo", []).append(action)
    save_state(project_dir, state)
    return action


def pop_redo(project_dir: Path) -> dict[str, Any] | None:
    state = load_state(project_dir)
    redo_stack = state.setdefault("redo", [])
    if not redo_stack:
        return None

    action = redo_stack.pop()
    state.setdefault("undo", []).append(action)
    save_state(project_dir, state)
    return action
