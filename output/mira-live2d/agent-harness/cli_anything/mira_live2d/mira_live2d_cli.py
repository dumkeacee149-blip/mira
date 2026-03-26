from __future__ import annotations

import json
import shlex
from pathlib import Path
from typing import Any

import click

from .core.session import record_action
from .core.workflow import (
    DEFAULT_PROJECT_NAME,
    DEFAULT_TEMPLATE_NAME,
    bootstrap_project,
    default_template_path,
    redo_action,
    status,
    undo_action,
)
from .utils.live2d_backend import launch_live2d
from .utils.live2d_backend import export_runtime_bundle
from .utils.photoshop_backend import create_psd_template, launch_photoshop


HARNESS_ROOT = Path(__file__).resolve().parents[2]
REFERENCE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def emit(payload: dict[str, Any], as_json: bool) -> None:
    if as_json:
        click.echo(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    for key, value in payload.items():
        click.echo(f"{key}: {value}")


def shared_context(ctx: click.Context) -> dict[str, Any]:
    ctx.ensure_object(dict)
    return ctx.obj


def rerun_bootstrap(project_dir: Path, project_name: str, template_name: str) -> dict[str, Any]:
    return bootstrap_project(
        project_dir=project_dir,
        project_name=project_name,
        template_name=template_name,
        dry_run=False,
    )


def rerun_template(project_dir: Path, action: dict[str, Any]) -> dict[str, Any]:
    result = create_psd_template(
        harness_root=HARNESS_ROOT,
        output_psd=Path(action["output_psd"]),
        reference_images=[Path(path) for path in action.get("reference_images", [])],
        document_name=action["document_name"],
        width=action["width"],
        height=action["height"],
        resolution=action["resolution"],
        keep_open=False,
        dry_run=False,
    )
    record_action(project_dir, action)
    return result


def collect_reference_images(project_dir: Path, explicit_references: tuple[Path, ...]) -> list[Path]:
    if explicit_references:
        return list(explicit_references)

    references_dir = project_dir / "references"
    if not references_dir.exists():
        return []

    return sorted(
        [
            path
            for path in references_dir.iterdir()
            if path.is_file() and path.suffix.lower() in REFERENCE_EXTENSIONS
        ],
        key=lambda path: path.name.lower(),
    )


def latest_cubism_project_path(project_dir: Path) -> Path | None:
    working_dir = project_dir / "working"
    if not working_dir.exists():
        return None

    candidates = sorted(
        working_dir.glob("*.cmo3"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return candidates[0] if candidates else None


def start_repl(project_dir: Path, as_json: bool) -> None:
    click.echo(f"mira-live2d repl for {project_dir}")
    click.echo("type 'help' for commands or 'exit' to quit")

    while True:
        raw = click.prompt("mira-live2d", prompt_suffix="> ", default="", show_default=False)
        command = raw.strip()
        if not command:
            continue

        if command in {"exit", "quit"}:
            break

        if command == "help":
            click.echo(
                "commands: bootstrap, status, create-psd-template, launch-photoshop, launch-live2d, "
                "export-runtime, undo, redo, exit"
            )
            continue

        args = ["--project-dir", str(project_dir)]
        if as_json:
            args.append("--json")
        args.extend(shlex.split(command))

        try:
            cli.main(args=args, standalone_mode=False)
        except SystemExit:
            continue
        except Exception as error:  # noqa: BLE001
            click.echo(f"error: {error}")


@click.group(invoke_without_command=True)
@click.option(
    "--project-dir",
    type=click.Path(path_type=Path),
    default=Path(r"G:\JOE AGENT\mira\output\mira-live2d\workspace"),
    show_default=True,
)
@click.option("--json", "as_json", is_flag=True, help="Emit machine-readable JSON output.")
@click.pass_context
def cli(ctx: click.Context, project_dir: Path, as_json: bool) -> None:
    """Prepare and manage the Mira Live2D Photoshop-to-Cubism workflow."""
    state = shared_context(ctx)
    state["project_dir"] = project_dir
    state["as_json"] = as_json
    if ctx.invoked_subcommand is None:
        start_repl(project_dir, as_json)


@cli.command("bootstrap")
@click.option("--project-name", default=DEFAULT_PROJECT_NAME, show_default=True)
@click.option("--template-name", default=DEFAULT_TEMPLATE_NAME, show_default=True)
@click.option("--dry-run", is_flag=True)
@click.pass_context
def bootstrap_command(
    ctx: click.Context,
    project_name: str,
    template_name: str,
    dry_run: bool,
) -> None:
    state = shared_context(ctx)
    result = bootstrap_project(
        project_dir=state["project_dir"],
        project_name=project_name,
        template_name=template_name,
        dry_run=dry_run,
    )
    emit(result, state["as_json"])


@cli.command("status")
@click.option("--template-name", default=DEFAULT_TEMPLATE_NAME, show_default=True)
@click.pass_context
def status_command(ctx: click.Context, template_name: str) -> None:
    state = shared_context(ctx)
    emit(status(state["project_dir"], template_name=template_name), state["as_json"])


@cli.command("create-psd-template")
@click.option("--template-name", default=DEFAULT_TEMPLATE_NAME, show_default=True)
@click.option("--reference-image", type=click.Path(exists=True, path_type=Path), multiple=True)
@click.option("--width", default=6144, show_default=True, type=int)
@click.option("--height", default=8192, show_default=True, type=int)
@click.option("--resolution", default=300, show_default=True, type=int)
@click.option("--keep-open", is_flag=True)
@click.option("--dry-run", is_flag=True)
@click.pass_context
def create_psd_template_command(
    ctx: click.Context,
    template_name: str,
    reference_image: tuple[Path, ...],
    width: int,
    height: int,
    resolution: int,
    keep_open: bool,
    dry_run: bool,
) -> None:
    state = shared_context(ctx)
    project_dir: Path = state["project_dir"]
    project_dir.mkdir(parents=True, exist_ok=True)
    output_psd = default_template_path(project_dir, template_name)
    reference_images = collect_reference_images(project_dir, reference_image)
    result = create_psd_template(
        harness_root=HARNESS_ROOT,
        output_psd=output_psd,
        reference_images=reference_images,
        document_name=template_name,
        width=width,
        height=height,
        resolution=resolution,
        keep_open=keep_open,
        dry_run=dry_run,
    )

    if not dry_run:
        record_action(
            project_dir,
            {
                "type": "create_psd_template",
                "output_psd": str(output_psd),
                "reference_images": [str(path) for path in reference_images],
                "document_name": template_name,
                "width": width,
                "height": height,
                "resolution": resolution,
            },
        )

    emit(result, state["as_json"])


@cli.command("launch-photoshop")
@click.option("--path", "target_path", type=click.Path(path_type=Path))
@click.option("--dry-run", is_flag=True)
@click.pass_context
def launch_photoshop_command(ctx: click.Context, target_path: Path | None, dry_run: bool) -> None:
    state = shared_context(ctx)
    if target_path is None:
        target_path = default_template_path(state["project_dir"])
    emit(launch_photoshop(target_path=target_path, dry_run=dry_run), state["as_json"])


@cli.command("launch-live2d")
@click.option("--path", "target_path", type=click.Path(path_type=Path))
@click.option("--dry-run", is_flag=True)
@click.pass_context
def launch_live2d_command(ctx: click.Context, target_path: Path | None, dry_run: bool) -> None:
    state = shared_context(ctx)
    if target_path is None:
        target_path = default_template_path(state["project_dir"])
    emit(launch_live2d(target_path=target_path, dry_run=dry_run), state["as_json"])


@cli.command("export-runtime")
@click.option("--path", "target_path", type=click.Path(exists=True, path_type=Path))
@click.option("--dry-run", is_flag=True)
@click.pass_context
def export_runtime_command(ctx: click.Context, target_path: Path | None, dry_run: bool) -> None:
    state = shared_context(ctx)
    project_dir: Path = state["project_dir"]
    if target_path is None:
        target_path = latest_cubism_project_path(project_dir)
    if target_path is None:
        raise click.ClickException("No .cmo3 project file was found in the working directory.")

    emit(
        export_runtime_bundle(
            target_path=target_path,
            export_root=project_dir / "exports",
            dry_run=dry_run,
        ),
        state["as_json"],
    )


@cli.command("undo")
@click.pass_context
def undo_command(ctx: click.Context) -> None:
    state = shared_context(ctx)
    emit(undo_action(state["project_dir"]), state["as_json"])


@cli.command("redo")
@click.pass_context
def redo_command(ctx: click.Context) -> None:
    state = shared_context(ctx)
    emit(
        redo_action(
            project_dir=state["project_dir"],
            rerun_bootstrap=rerun_bootstrap,
            rerun_template=lambda action: rerun_template(state["project_dir"], action),
        ),
        state["as_json"],
    )
