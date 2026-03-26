param(
  [Parameter(Mandatory = $true)]
  [string]$JsxPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPsd,

  [string]$ReferenceImagesJoined = "",
  [string]$DocumentName = "Mira_Live2D_Template",
  [int]$Width = 6144,
  [int]$Height = 8192,
  [int]$Resolution = 300,
  [switch]$KeepOpen
)

$ErrorActionPreference = 'Stop'

function Invoke-WithRetry {
  param(
    [Parameter(Mandatory = $true)]
    [scriptblock]$Operation,

    [Parameter(Mandatory = $true)]
    [string]$Description,

    [int]$MaxAttempts = 12,
    [int]$DelayMilliseconds = 1000
  )

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    try {
      return & $Operation
    }
    catch [System.Runtime.InteropServices.COMException] {
      $isBusy = $_.Exception.HResult -eq -2147417846 -or $_.Exception.Message -like '*application is busy*'
      if (-not $isBusy -or $attempt -eq $MaxAttempts) {
        throw
      }

      Start-Sleep -Milliseconds $DelayMilliseconds
    }
  }
}

function ConvertTo-JsString {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  return ($Value -replace '\\', '\\\\' -replace '"', '\"')
}

if (!(Test-Path -LiteralPath $JsxPath)) {
  throw "Photoshop JSX script not found: $JsxPath"
}

$outputDirectory = Split-Path -Path $OutputPsd -Parent
if (!(Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$joinedReferenceImages = $ReferenceImagesJoined
$referenceImageList = @()
if ($joinedReferenceImages) {
  $referenceImageList = $joinedReferenceImages.Split('|') | Where-Object { $_ -and $_.Trim().Length -gt 0 }
}

$escapedJsxPath = ConvertTo-JsString -Value $JsxPath
$escapedOutputPsd = ConvertTo-JsString -Value $OutputPsd
$escapedDocumentName = ConvertTo-JsString -Value $DocumentName
$referenceImageArrayLiteral = ($referenceImageList | ForEach-Object {
  '"' + (ConvertTo-JsString -Value $_) + '"'
}) -join ', '

$bootstrapJsxPath = Join-Path $env:TEMP ("mira-live2d-bootstrap-" + [guid]::NewGuid().ToString() + ".jsx")
$bootstrapJsx = @"
var MIRA_CONFIG = {
  outputPath: "$escapedOutputPsd",
  referencePaths: [$referenceImageArrayLiteral],
  documentName: "$escapedDocumentName",
  width: $Width,
  height: $Height,
  resolution: $Resolution
};
#include "$escapedJsxPath"
"@

Set-Content -LiteralPath $bootstrapJsxPath -Value $bootstrapJsx -Encoding UTF8

$app = $null
$wasRunning = [bool](Get-Process Photoshop -ErrorAction SilentlyContinue)

try {
  $app = Invoke-WithRetry -Description 'start Photoshop COM application' -Operation {
    New-Object -ComObject Photoshop.Application
  }
  $app.DisplayDialogs = 3
  Invoke-WithRetry -Description 'run Photoshop JSX automation' -Operation {
    $app.DoJavaScriptFile($bootstrapJsxPath) | Out-Null
  }
}
finally {
  if (Test-Path -LiteralPath $bootstrapJsxPath) {
    Remove-Item -LiteralPath $bootstrapJsxPath -Force -ErrorAction SilentlyContinue
  }

  if ($app -and -not $KeepOpen.IsPresent -and -not $wasRunning) {
    try {
      Start-Sleep -Milliseconds 1000
      Invoke-WithRetry -Description 'quit Photoshop' -Operation {
        $app.Quit()
      }
    }
    catch {
      Write-Warning "Photoshop quit failed: $($_.Exception.Message)"
    }
  }
}
