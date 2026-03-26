from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .session import pop_redo, pop_undo, record_action


DEFAULT_PROJECT_NAME = "Mira Live2D Avatar"
DEFAULT_TEMPLATE_NAME = "Mira_Live2D_Template"
PROJECT_DIRS = [
    "references",
    "working",
    "exports",
    "docs",
]


def manifest_path(project_dir: Path) -> Path:
    return project_dir / "mira-live2d-project.json"


def layer_plan_path(project_dir: Path) -> Path:
    return project_dir / "docs" / "mira-live2d-layer-plan.md"


def default_template_path(project_dir: Path, template_name: str = DEFAULT_TEMPLATE_NAME) -> Path:
    return project_dir / "working" / f"{template_name}.psd"


def layer_plan_markdown() -> str:
    return """# Mira Live2D Layer Plan

This plan is tuned for the provided Mira concept art:

- silver twin-tail hairstyle with long flowing masses
- amber eyes with gentle neutral and thinking expressions
- cream vintage dress with layered frills and ribbon details
- camera and leather strap as the hero accessory

## Split priorities

1. Face:
   - brows, eye whites, irises, pupils, highlights, lids, lashes, mouth parts, blush
2. Hair:
   - back hair, bangs, side locks, left and right twin tails split into root, middle, and tip chunks
3. Body:
   - neck, torso, waist, arms, hands, left and right legs
4. Dress:
   - collar, bow, bodice, sleeves, cuffs, skirt front, skirt back, underskirt frill, small ribbons
5. Accessories:
   - camera, lens, strap, tassel, socks, shoes, earrings, hair ornaments

## Expression targets

- neutral
- warm smile
- focused shooting
- puzzled / thinking
- shy / blush

## Cubism parameter suggestions

- Angle X / Y / Z
- Body X / Y / Z
- Eye open left / right
- Eye smile left / right
- Mouth open Y
- Mouth form
- Brow left / right
- Hair sway front / back
- Twin tail swing left / right
- Skirt sway
- Camera sway

## Missing painted geometry

Before rigging, redraw the hidden parts behind:

- long front hair masses
- sleeves overlapping torso
- camera and straps covering the dress center
- skirt overlaps near the underskirt and legs
"""


def default_manifest(project_dir: Path, project_name: str, template_name: str) -> dict[str, Any]:
    return {
        "project_name": project_name,
        "working_root": str(project_dir),
        "character_summary": {
            "theme": "soft vintage photographer",
            "hair": "silver twin tails with ornaments",
            "eyes": "amber",
            "primary_outfit": "cream dress with black ribbon accents",
            "hero_prop": "camera with leather straps",
        },
        "files": {
            "layer_plan": str(layer_plan_path(project_dir)),
            "template_psd": str(default_template_path(project_dir, template_name)),
            "target_cubism_project": str(project_dir / "working" / f"{template_name}.cmo3"),
        },
        "required_source_assets": [
            "front-facing full-body original image file on disk",
            "close-up face or expression sheet file on disk",
            "permission to repaint hidden areas for rigging",
        ],
        "current_blockers": [
            "reference images are not yet available as local files to import automatically",
            "the concept art is not already split into Live2D-ready paint layers",
        ],
        "recommended_extra_software": [
            "optional: Clip Studio Paint or Krita for heavy repainting and cut repair",
            "optional: VTube Studio for post-rig avatar testing",
        ],
    }


def bootstrap_project(
    project_dir: Path,
    project_name: str = DEFAULT_PROJECT_NAME,
    template_name: str = DEFAULT_TEMPLATE_NAME,
    dry_run: bool = False,
) -> dict[str, Any]:
    created_paths: list[str] = []
    files_to_write = {
        manifest_path(project_dir): json.dumps(
            default_manifest(project_dir, project_name, template_name),
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        layer_plan_path(project_dir): layer_plan_markdown(),
    }

    for directory_name in PROJECT_DIRS:
        directory = project_dir / directory_name
        if not dry_run and not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
        created_paths.append(str(directory))

    for path, content in files_to_write.items():
        if not dry_run:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        created_paths.append(str(path))

    action = {
        "type": "bootstrap",
        "project_name": project_name,
        "template_name": template_name,
        "created_paths": created_paths,
    }

    if not dry_run:
        record_action(project_dir, action)

    return {
        "action": "bootstrap",
        "project_dir": str(project_dir),
        "created_paths": created_paths,
        "dry_run": dry_run,
    }


def status(project_dir: Path, template_name: str = DEFAULT_TEMPLATE_NAME) -> dict[str, Any]:
    template_path = default_template_path(project_dir, template_name)
    reference_dir = project_dir / "references"
    references = []
    if reference_dir.exists():
        references = sorted(str(path) for path in reference_dir.iterdir() if path.is_file())

    blocking_items = [
        "paint the actual layer contents into the generated PSD template",
        "finish manual rigging in Live2D Cubism",
    ]
    if not references:
        blocking_items.insert(0, "import the original character images into the references folder")

    return {
        "project_dir": str(project_dir),
        "exists": project_dir.exists(),
        "manifest_exists": manifest_path(project_dir).exists(),
        "layer_plan_exists": layer_plan_path(project_dir).exists(),
        "template_psd_exists": template_path.exists(),
        "template_psd": str(template_path),
        "references": references,
        "blocking_items": blocking_items,
    }


def _remove_if_exists(path: Path) -> None:
    if path.is_file():
        path.unlink()
    elif path.is_dir():
        try:
            path.rmdir()
        except OSError:
            pass


def undo_action(project_dir: Path) -> dict[str, Any]:
    action = pop_undo(project_dir)
    if action is None:
        return {"action": "undo", "reverted": False, "reason": "nothing to undo"}

    if action["type"] == "bootstrap":
        for raw_path in reversed(action["created_paths"]):
            _remove_if_exists(Path(raw_path))
    elif action["type"] == "create_psd_template":
        _remove_if_exists(Path(action["output_psd"]))

    return {"action": "undo", "reverted": True, "reverted_action": action}


def redo_action(
    project_dir: Path,
    rerun_bootstrap,
    rerun_template,
) -> dict[str, Any]:
    action = pop_redo(project_dir)
    if action is None:
        return {"action": "redo", "replayed": False, "reason": "nothing to redo"}

    if action["type"] == "bootstrap":
        result = rerun_bootstrap(
            project_dir=project_dir,
            project_name=action["project_name"],
            template_name=action["template_name"],
        )
    elif action["type"] == "create_psd_template":
        result = rerun_template(action)
    else:
        result = {"action": "redo", "replayed": False, "reason": f"unsupported action: {action['type']}"}

    return {"action": "redo", "replayed": True, "replayed_action": action, "result": result}
