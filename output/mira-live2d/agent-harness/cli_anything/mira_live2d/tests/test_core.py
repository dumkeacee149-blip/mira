import os
from pathlib import Path

from cli_anything.mira_live2d.core.workflow import bootstrap_project, redo_action, status, undo_action
from cli_anything.mira_live2d.mira_live2d_cli import collect_reference_images, latest_cubism_project_path
from cli_anything.mira_live2d.utils.live2d_backend import (
    clear_runtime_artifacts,
    clear_runtime_artifacts_from_roots,
    collect_runtime_artifacts,
    collect_runtime_artifacts_from_roots,
    runtime_search_roots,
    stage_runtime_artifacts,
)


def test_bootstrap_writes_manifest_and_layer_plan(tmp_path: Path) -> None:
    result = bootstrap_project(tmp_path)

    assert result["action"] == "bootstrap"
    assert (tmp_path / "mira-live2d-project.json").exists()
    assert (tmp_path / "docs" / "mira-live2d-layer-plan.md").exists()


def test_undo_and_redo_bootstrap(tmp_path: Path) -> None:
    bootstrap_project(tmp_path)
    undone = undo_action(tmp_path)

    assert undone["reverted"] is True
    assert not (tmp_path / "mira-live2d-project.json").exists()

    redone = redo_action(
        project_dir=tmp_path,
        rerun_bootstrap=lambda project_dir, project_name, template_name: bootstrap_project(project_dir, project_name, template_name),
        rerun_template=lambda action: {"action": "noop", "replayed_action": action},
    )

    assert redone["replayed"] is True
    assert (tmp_path / "mira-live2d-project.json").exists()


def test_status_reports_missing_template(tmp_path: Path) -> None:
    bootstrap_project(tmp_path)
    result = status(tmp_path)

    assert result["manifest_exists"] is True
    assert result["template_psd_exists"] is False
    assert "import the original character images into the references folder" in result["blocking_items"]


def test_collect_reference_images_uses_project_references_folder(tmp_path: Path) -> None:
    bootstrap_project(tmp_path)
    reference_a = tmp_path / "references" / "b.png"
    reference_b = tmp_path / "references" / "a.jpg"
    reference_a.write_bytes(b"")
    reference_b.write_bytes(b"")

    result = collect_reference_images(tmp_path, ())

    assert result == [reference_b, reference_a]


def test_status_removes_import_blocker_when_references_exist(tmp_path: Path) -> None:
    bootstrap_project(tmp_path)
    (tmp_path / "references" / "mira.png").write_bytes(b"")

    result = status(tmp_path)

    assert "import the original character images into the references folder" not in result["blocking_items"]


def test_latest_cubism_project_path_picks_most_recent_cmo3(tmp_path: Path) -> None:
    bootstrap_project(tmp_path)
    older = tmp_path / "working" / "older.cmo3"
    newer = tmp_path / "working" / "newer.cmo3"
    older.write_text("older", encoding="utf-8")
    newer.write_text("newer", encoding="utf-8")
    os.utime(older, (1, 1))
    os.utime(newer, (2, 2))

    result = latest_cubism_project_path(tmp_path)

    assert result == newer


def test_collect_and_stage_runtime_artifacts_preserves_expected_bundle_layout(tmp_path: Path) -> None:
    desktop_root = tmp_path / "desktop"
    export_root = tmp_path / "exports"
    atlas_dir = desktop_root / "Mira_Live2D_RoughSplit.1024"
    atlas_dir.mkdir(parents=True)
    (atlas_dir / "texture_00.png").write_bytes(b"png")
    (desktop_root / "Mira_Live2D_RoughSplit.moc3").write_bytes(b"moc3")
    (desktop_root / "Mira_Live2D_RoughSplit.model3.json").write_text("{}", encoding="utf-8")
    (desktop_root / "Mira_Live2D_RoughSplit.cdi3.json").write_text("{}", encoding="utf-8")

    artifacts = collect_runtime_artifacts(desktop_root, "Mira_Live2D_RoughSplit")
    staged_paths = stage_runtime_artifacts(artifacts, export_root, "Mira_Live2D_RoughSplit")

    assert [path.name for path in artifacts] == [
        "Mira_Live2D_RoughSplit.1024",
        "Mira_Live2D_RoughSplit.cdi3.json",
        "Mira_Live2D_RoughSplit.moc3",
        "Mira_Live2D_RoughSplit.model3.json",
    ]
    assert [path.name for path in staged_paths] == [path.name for path in artifacts]
    assert (export_root / "Mira_Live2D_RoughSplit" / "Mira_Live2D_RoughSplit.1024" / "texture_00.png").exists()


def test_runtime_search_roots_prefers_project_directory_before_desktop(tmp_path: Path, monkeypatch) -> None:
    project_file = tmp_path / "working" / "Mira_Live2D_Exportable.cmo3"
    project_file.parent.mkdir(parents=True)
    project_file.write_text("project", encoding="utf-8")
    fake_desktop = tmp_path / "desktop"
    fake_desktop.mkdir()
    monkeypatch.setattr(
        "cli_anything.mira_live2d.utils.live2d_backend.desktop_directory",
        lambda: fake_desktop,
    )

    result = runtime_search_roots(project_file)

    assert result == [project_file.parent, fake_desktop]


def test_collect_runtime_artifacts_from_roots_returns_first_matching_bundle(tmp_path: Path) -> None:
    working_root = tmp_path / "working"
    desktop_root = tmp_path / "desktop"
    for root in (working_root, desktop_root):
        root.mkdir(parents=True)
    (desktop_root / "Mira_Live2D_Exportable.model3.json").write_text("desktop", encoding="utf-8")
    (working_root / "Mira_Live2D_Exportable.model3.json").write_text("working", encoding="utf-8")

    result = collect_runtime_artifacts_from_roots(
        [working_root, desktop_root],
        "Mira_Live2D_Exportable",
    )

    assert result == [working_root / "Mira_Live2D_Exportable.model3.json"]


def test_clear_runtime_artifacts_removes_matching_files_and_atlas_directory(tmp_path: Path) -> None:
    desktop_root = tmp_path / "desktop"
    atlas_dir = desktop_root / "Mira_Live2D_RoughSplit.1024"
    atlas_dir.mkdir(parents=True)
    (atlas_dir / "texture_00.png").write_bytes(b"png")
    (desktop_root / "Mira_Live2D_RoughSplit.moc3").write_bytes(b"moc3")

    clear_runtime_artifacts(desktop_root, "Mira_Live2D_RoughSplit")

    assert not atlas_dir.exists()
    assert not (desktop_root / "Mira_Live2D_RoughSplit.moc3").exists()


def test_clear_runtime_artifacts_from_roots_removes_matching_outputs_from_each_root(tmp_path: Path) -> None:
    working_root = tmp_path / "working"
    desktop_root = tmp_path / "desktop"
    for root in (working_root, desktop_root):
        atlas_dir = root / "Mira_Live2D_Exportable.1024"
        atlas_dir.mkdir(parents=True)
        (atlas_dir / "texture_00.png").write_bytes(b"png")
        (root / "Mira_Live2D_Exportable.moc3").write_bytes(b"moc3")

    clear_runtime_artifacts_from_roots([working_root, desktop_root], "Mira_Live2D_Exportable")

    assert not (working_root / "Mira_Live2D_Exportable.moc3").exists()
    assert not (desktop_root / "Mira_Live2D_Exportable.moc3").exists()
    assert not (working_root / "Mira_Live2D_Exportable.1024").exists()
    assert not (desktop_root / "Mira_Live2D_Exportable.1024").exists()
