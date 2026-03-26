# cli-anything-mira-live2d

CLI-Anything style harness for preparing a Mira Live2D avatar project with Photoshop and Live2D Cubism.

## Commands

- `bootstrap`: create the project folder structure and written production plan
- `status`: inspect files and unresolved blockers
- `create-psd-template`: generate a layered PSD template in Photoshop
- `launch-photoshop`: open Photoshop on a path
- `launch-live2d`: open Live2D Cubism on a PSD or model file
- `export-runtime`: enable Java Access Bridge, trigger Cubism runtime export, and stage the bundle into `exports/`
- `undo`: revert the last reversible file-creation action
- `redo`: re-run the last undone reversible file-creation action

When no subcommand is provided, the CLI starts an interactive REPL.
