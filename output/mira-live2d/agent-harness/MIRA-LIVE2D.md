# Mira Live2D Workflow

Target software and source path:

- Adobe Photoshop 2022: `C:\Program Files\Adobe\Adobe Photoshop 2022\Photoshop.exe`
- Live2D Cubism Editor 5.3: `F:\Program Files\Live2D Cubism 5.3\CubismEditor5.bat`
- Working root: `G:\JOE AGENT\mira\output\mira-live2d`

This harness prepares a reusable Photoshop-to-Live2D workflow for the Mira virtual avatar based on the provided character references:

- silver twin-tail hairstyle with floral and ribbon ornaments
- amber eyes and soft neutral expression set
- cream vintage dress with black ribbons and gold buttons
- camera, leather straps, tassel, socks, shoes, and small accessories

What it does now:

- bootstraps a project directory for Mira Live2D production
- writes a concrete layer split plan for Live2D-ready art
- creates a layered Photoshop PSD template through Photoshop automation
- launches Photoshop or Live2D on the generated project files
- enables the Java Access Bridge that Cubism bundles for desktop automation
- exports Cubism runtime files and stages the bundle into `workspace/exports`
- tracks reversible file-creation actions via undo and redo

What is still missing for a final production model:

- original high-resolution image files on disk
- manual redraw of hidden areas that are occluded in the reference art
- painted PSD parts instead of empty template layers
- manual rigging pass in Cubism for deformer layout, parameters, and physics

Open risks and backend limitations:

- the current references are concept sheets, not a rig-ready layered PSD
- Cubism runtime export can be automated, but final rigging still requires manual editing
- Photoshop automation creates the correct structure, but it cannot infer missing painted geometry from a flat concept image
