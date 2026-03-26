# Test Plan

1. Create a virtual environment and install the harness in editable mode:

```powershell
uv venv
uv pip install --python .\.venv\Scripts\python.exe -e . pytest
```

2. Run unit and end-to-end tests:

```powershell
.\.venv\Scripts\python.exe -m pytest cli_anything\mira_live2d\tests
```

3. Validate the installed CLI entry point:

```powershell
.\.venv\Scripts\cli-anything-mira-live2d.exe --project-dir G:\JOE AGENT\mira\output\mira-live2d\workspace --json status
```

4. Generate a real Photoshop PSD template:

```powershell
.\.venv\Scripts\cli-anything-mira-live2d.exe --project-dir G:\JOE AGENT\mira\output\mira-live2d\workspace create-psd-template
```
