app.displayDialogs = DialogModes.NO;

function envOrDefault(name, fallbackValue) {
  var value = $.getenv(name);
  if (value === null || value === undefined || value === "") {
    return fallbackValue;
  }

  return value;
}

function configOrDefault(key, fallbackValue) {
  if (typeof MIRA_CONFIG !== "undefined" && MIRA_CONFIG !== null) {
    var configValue = MIRA_CONFIG[key];
    if (configValue !== null && configValue !== undefined && configValue !== "") {
      return configValue;
    }
  }

  return fallbackValue;
}

function addGroup(container, name) {
  var group = container.layerSets.add();
  group.name = name;
  return group;
}

function addEmptyLayer(container, name) {
  var layer = container.artLayers.add();
  layer.name = name;
  return layer;
}

function buildLayerTree(doc) {
  var referenceGroup = addGroup(doc, "00-reference");
  var referenceRawGroup = addGroup(referenceGroup, "raw-sources");
  var referenceBoardGroup = addGroup(referenceGroup, "board");
  var referenceMainGroup = addGroup(referenceBoardGroup, "main-view");
  var referenceCloseupGroup = addGroup(referenceBoardGroup, "face-closeup");
  var referenceSheetGroup = addGroup(referenceBoardGroup, "detail-sheet");
  addEmptyLayer(referenceRawGroup, "portrait-placeholder");
  addEmptyLayer(referenceRawGroup, "expression-sheet-placeholder");

  var headGroup = addGroup(doc, "01-head");
  addEmptyLayer(headGroup, "head-base");
  addEmptyLayer(headGroup, "face-shadow");
  addEmptyLayer(headGroup, "ear-left");
  addEmptyLayer(headGroup, "ear-right");
  addEmptyLayer(headGroup, "nose");
  addEmptyLayer(headGroup, "blush");

  var hairGroup = addGroup(headGroup, "hair");
  addEmptyLayer(hairGroup, "back-hair");
  addEmptyLayer(hairGroup, "bang-center");
  addEmptyLayer(hairGroup, "bang-left");
  addEmptyLayer(hairGroup, "bang-right");
  addEmptyLayer(hairGroup, "side-hair-left");
  addEmptyLayer(hairGroup, "side-hair-right");
  addEmptyLayer(hairGroup, "twin-tail-left-root");
  addEmptyLayer(hairGroup, "twin-tail-left-mid");
  addEmptyLayer(hairGroup, "twin-tail-left-tip");
  addEmptyLayer(hairGroup, "twin-tail-right-root");
  addEmptyLayer(hairGroup, "twin-tail-right-mid");
  addEmptyLayer(hairGroup, "twin-tail-right-tip");
  addEmptyLayer(hairGroup, "flyaways-front");
  addEmptyLayer(hairGroup, "flyaways-back");

  var ornamentGroup = addGroup(headGroup, "ornaments");
  addEmptyLayer(ornamentGroup, "hair-ribbon-left");
  addEmptyLayer(ornamentGroup, "hair-ribbon-right");
  addEmptyLayer(ornamentGroup, "flower-ornaments-left");
  addEmptyLayer(ornamentGroup, "flower-ornaments-right");
  addEmptyLayer(ornamentGroup, "earring-left");
  addEmptyLayer(ornamentGroup, "earring-right");

  var eyebrowGroup = addGroup(headGroup, "eyebrows");
  addEmptyLayer(eyebrowGroup, "eyebrow-left");
  addEmptyLayer(eyebrowGroup, "eyebrow-right");

  var eyeLeft = addGroup(headGroup, "eye-left");
  addEmptyLayer(eyeLeft, "white");
  addEmptyLayer(eyeLeft, "iris");
  addEmptyLayer(eyeLeft, "pupil");
  addEmptyLayer(eyeLeft, "highlight");
  addEmptyLayer(eyeLeft, "upper-lid");
  addEmptyLayer(eyeLeft, "lower-lid");
  addEmptyLayer(eyeLeft, "eyelash-line");

  var eyeRight = addGroup(headGroup, "eye-right");
  addEmptyLayer(eyeRight, "white");
  addEmptyLayer(eyeRight, "iris");
  addEmptyLayer(eyeRight, "pupil");
  addEmptyLayer(eyeRight, "highlight");
  addEmptyLayer(eyeRight, "upper-lid");
  addEmptyLayer(eyeRight, "lower-lid");
  addEmptyLayer(eyeRight, "eyelash-line");

  var mouthGroup = addGroup(headGroup, "mouth");
  addEmptyLayer(mouthGroup, "mouth-line");
  addEmptyLayer(mouthGroup, "upper-lip");
  addEmptyLayer(mouthGroup, "lower-lip");
  addEmptyLayer(mouthGroup, "inner-mouth");
  addEmptyLayer(mouthGroup, "tongue");
  addEmptyLayer(mouthGroup, "teeth");
  var roughHeadGroup = addGroup(headGroup, "rough-autosplit");
  var roughHairGroup = addGroup(hairGroup, "rough-autosplit");
  var roughOrnamentGroup = addGroup(ornamentGroup, "rough-autosplit");
  var roughEyebrowGroup = addGroup(eyebrowGroup, "rough-autosplit");
  var roughEyeLeftGroup = addGroup(eyeLeft, "rough-autosplit");
  var roughEyeRightGroup = addGroup(eyeRight, "rough-autosplit");
  var roughMouthGroup = addGroup(mouthGroup, "rough-autosplit");

  var bodyGroup = addGroup(doc, "02-body");
  addEmptyLayer(bodyGroup, "neck");
  addEmptyLayer(bodyGroup, "torso");
  addEmptyLayer(bodyGroup, "waist");
  addEmptyLayer(bodyGroup, "leg-left");
  addEmptyLayer(bodyGroup, "leg-right");
  addEmptyLayer(bodyGroup, "hand-left");
  addEmptyLayer(bodyGroup, "hand-right");
  var roughBodyGroup = addGroup(bodyGroup, "rough-autosplit");

  var dressGroup = addGroup(doc, "03-dress");
  addEmptyLayer(dressGroup, "collar");
  addEmptyLayer(dressGroup, "bow-main");
  addEmptyLayer(dressGroup, "bow-left-tail");
  addEmptyLayer(dressGroup, "bow-right-tail");
  addEmptyLayer(dressGroup, "bodice");
  addEmptyLayer(dressGroup, "button-strip");
  addEmptyLayer(dressGroup, "buttons");
  addEmptyLayer(dressGroup, "frill-left");
  addEmptyLayer(dressGroup, "frill-right");
  addEmptyLayer(dressGroup, "sleeve-left");
  addEmptyLayer(dressGroup, "sleeve-right");
  addEmptyLayer(dressGroup, "cuff-left");
  addEmptyLayer(dressGroup, "cuff-right");
  addEmptyLayer(dressGroup, "skirt-front");
  addEmptyLayer(dressGroup, "skirt-back");
  addEmptyLayer(dressGroup, "underskirt-frill");
  addEmptyLayer(dressGroup, "sleeve-ribbon-left");
  addEmptyLayer(dressGroup, "sleeve-ribbon-right");
  var roughDressGroup = addGroup(dressGroup, "rough-autosplit");

  var accessoryGroup = addGroup(doc, "04-accessories");
  addEmptyLayer(accessoryGroup, "camera-body");
  addEmptyLayer(accessoryGroup, "camera-lens");
  addEmptyLayer(accessoryGroup, "camera-highlight");
  addEmptyLayer(accessoryGroup, "strap-left");
  addEmptyLayer(accessoryGroup, "strap-right");
  addEmptyLayer(accessoryGroup, "tassel");
  addEmptyLayer(accessoryGroup, "sock-left");
  addEmptyLayer(accessoryGroup, "sock-right");
  addEmptyLayer(accessoryGroup, "shoe-left");
  addEmptyLayer(accessoryGroup, "shoe-right");
  var roughAccessoryGroup = addGroup(accessoryGroup, "rough-autosplit");

  var guideGroup = addGroup(doc, "05-guides");
  addEmptyLayer(guideGroup, "paintover-notes");
  addEmptyLayer(guideGroup, "cut-lines-check");
  addEmptyLayer(guideGroup, "hidden-area-redraw-check");

  return {
    referenceGroup: referenceGroup,
    referenceRawGroup: referenceRawGroup,
    referenceMainGroup: referenceMainGroup,
    referenceCloseupGroup: referenceCloseupGroup,
    referenceSheetGroup: referenceSheetGroup,
    roughHeadGroup: roughHeadGroup,
    roughHairGroup: roughHairGroup,
    roughOrnamentGroup: roughOrnamentGroup,
    roughEyebrowGroup: roughEyebrowGroup,
    roughEyeLeftGroup: roughEyeLeftGroup,
    roughEyeRightGroup: roughEyeRightGroup,
    roughMouthGroup: roughMouthGroup,
    roughBodyGroup: roughBodyGroup,
    roughDressGroup: roughDressGroup,
    roughAccessoryGroup: roughAccessoryGroup
  };
}

function splitReferencePaths(rawValue) {
  if (!rawValue) {
    return [];
  }

  var paths = rawValue.split("|");
  var filtered = [];

  for (var i = 0; i < paths.length; i++) {
    if (paths[i]) {
      filtered.push(paths[i]);
    }
  }

  return filtered;
}

function placeLayerAt(layer, x, y) {
  var bounds = layer.bounds;
  var left = bounds[0].as("px");
  var top = bounds[1].as("px");

  layer.translate(x - left, y - top);
}

function layerDimensions(layer) {
  var bounds = layer.bounds;
  return {
    width: bounds[2].as("px") - bounds[0].as("px"),
    height: bounds[3].as("px") - bounds[1].as("px")
  };
}

function scaleLayerToFit(layer, maxWidth, maxHeight) {
  var dimensions = layerDimensions(layer);
  if (dimensions.width <= 0 || dimensions.height <= 0) {
    return 100;
  }

  var scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height);
  layer.resize(scale * 100, scale * 100, AnchorPosition.TOPLEFT);
  return scale;
}

function cropLayerByPercentages(doc, layer, leftRatio, topRatio, rightRatio, bottomRatio) {
  var bounds = layer.bounds;
  var left = bounds[0].as("px");
  var top = bounds[1].as("px");
  var right = bounds[2].as("px");
  var bottom = bounds[3].as("px");
  var width = right - left;
  var height = bottom - top;

  doc.activeLayer = layer;
  doc.selection.deselect();
  doc.selection.select([
    [left + (width * leftRatio), top + (height * topRatio)],
    [left + (width * rightRatio), top + (height * topRatio)],
    [left + (width * rightRatio), top + (height * bottomRatio)],
    [left + (width * leftRatio), top + (height * bottomRatio)]
  ]);
  doc.selection.invert();
  doc.selection.clear();
  doc.selection.deselect();
}

function importReferenceLayer(doc, targetGroup, referencePath, index) {
  var referenceFile = new File(referencePath);
  if (!referenceFile.exists) {
    return null;
  }

  var referenceDocument = open(referenceFile);
  var sourceLayer = referenceDocument.activeLayer;
  var imported = sourceLayer.duplicate(targetGroup, ElementPlacement.PLACEATBEGINNING);
  var importedWidth = referenceDocument.width.as("px");
  var importedHeight = referenceDocument.height.as("px");

  app.activeDocument = referenceDocument;
  referenceDocument.close(SaveOptions.DONOTSAVECHANGES);
  app.activeDocument = doc;

  imported.name = "raw-reference-" + (index + 1) + "-" + referenceFile.name;
  imported.opacity = 100;

  return {
    file: referenceFile,
    layer: imported,
    width: importedWidth,
    height: importedHeight
  };
}

function choosePortraitReference(importedReferences) {
  var portrait = null;
  for (var i = 0; i < importedReferences.length; i++) {
    var reference = importedReferences[i];
    if (reference.height < reference.width) {
      continue;
    }

    if (portrait === null || (reference.width * reference.height) > (portrait.width * portrait.height)) {
      portrait = reference;
    }
  }

  if (portrait !== null) {
    return portrait;
  }

  return importedReferences.length > 0 ? importedReferences[0] : null;
}

function chooseSheetReference(importedReferences, portraitReference) {
  var sheet = null;
  for (var i = 0; i < importedReferences.length; i++) {
    var reference = importedReferences[i];
    if (portraitReference && reference.file.fsName === portraitReference.file.fsName) {
      continue;
    }

    if (sheet === null || (reference.width * reference.height) > (sheet.width * sheet.height)) {
      sheet = reference;
    }
  }

  return sheet;
}

function placeReferences(doc, groups, referencePaths) {
  if (!referencePaths || referencePaths.length === 0) {
    return;
  }

  var importedReferences = [];
  for (var index = 0; index < referencePaths.length; index++) {
    var importedReference = importReferenceLayer(doc, groups.referenceRawGroup, referencePaths[index], index);
    if (importedReference !== null) {
      importedReferences.push(importedReference);
    }
  }

  if (importedReferences.length === 0) {
    return;
  }

  groups.referenceRawGroup.visible = false;

  var docWidth = doc.width.as("px");
  var docHeight = doc.height.as("px");
  var portraitReference = choosePortraitReference(importedReferences);
  var sheetReference = chooseSheetReference(importedReferences, portraitReference);

  if (portraitReference !== null) {
    var mainReference = portraitReference.layer.duplicate(groups.referenceMainGroup, ElementPlacement.PLACEATBEGINNING);
    mainReference.name = "reference-main-portrait";
    mainReference.opacity = 45;
    scaleLayerToFit(mainReference, docWidth * 0.52, docHeight * 0.72);
    placeLayerAt(mainReference, docWidth * 0.06, docHeight * 0.16);

    var faceReference = portraitReference.layer.duplicate(groups.referenceCloseupGroup, ElementPlacement.PLACEATBEGINNING);
    faceReference.name = "reference-face-closeup";
    cropLayerByPercentages(doc, faceReference, 0.18, 0.02, 0.82, 0.38);
    faceReference.opacity = 82;
    scaleLayerToFit(faceReference, docWidth * 0.28, docHeight * 0.28);
    placeLayerAt(faceReference, docWidth * 0.66, docHeight * 0.04);
  }

  if (sheetReference !== null) {
    var detailSheet = sheetReference.layer.duplicate(groups.referenceSheetGroup, ElementPlacement.PLACEATBEGINNING);
    detailSheet.name = "reference-detail-sheet";
    detailSheet.opacity = 82;
    scaleLayerToFit(detailSheet, docWidth * 0.34, docHeight * 0.34);
    placeLayerAt(detailSheet, docWidth * 0.60, docHeight * 0.36);
  }

  return {
    portraitReference: portraitReference,
    sheetReference: sheetReference
  };
}

function createRoughPart(doc, sourceLayer, targetGroup, name, leftRatio, topRatio, rightRatio, bottomRatio, opacity) {
  var roughLayer = sourceLayer.duplicate(targetGroup, ElementPlacement.PLACEATBEGINNING);
  roughLayer.name = name;
  cropLayerByPercentages(doc, roughLayer, leftRatio, topRatio, rightRatio, bottomRatio);
  roughLayer.opacity = opacity || 100;
  return roughLayer;
}

function createAutoSplitLayers(doc, groups, portraitReference) {
  if (!portraitReference || !portraitReference.layer) {
    return;
  }

  var sourceLayer = portraitReference.layer;

  createRoughPart(doc, sourceLayer, groups.roughHeadGroup, "rough-head-base", 0.27, 0.03, 0.74, 0.38, 100);
  createRoughPart(doc, sourceLayer, groups.roughHeadGroup, "rough-ear-left", 0.21, 0.13, 0.35, 0.28, 100);
  createRoughPart(doc, sourceLayer, groups.roughHeadGroup, "rough-ear-right", 0.65, 0.13, 0.79, 0.28, 100);
  createRoughPart(doc, sourceLayer, groups.roughHeadGroup, "rough-blush-face-area", 0.30, 0.16, 0.71, 0.34, 75);

  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-back-hair", 0.02, 0.00, 0.98, 0.96, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-bang-center", 0.33, 0.00, 0.67, 0.19, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-bang-left", 0.20, 0.03, 0.49, 0.23, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-bang-right", 0.51, 0.03, 0.80, 0.23, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-side-hair-left", 0.08, 0.15, 0.31, 0.49, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-side-hair-right", 0.69, 0.15, 0.92, 0.49, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-twin-tail-left-root", 0.01, 0.18, 0.29, 0.56, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-twin-tail-left-mid", 0.00, 0.46, 0.29, 0.79, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-twin-tail-left-tip", 0.00, 0.72, 0.33, 1.00, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-twin-tail-right-root", 0.71, 0.18, 0.99, 0.56, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-twin-tail-right-mid", 0.71, 0.46, 1.00, 0.79, 100);
  createRoughPart(doc, sourceLayer, groups.roughHairGroup, "rough-twin-tail-right-tip", 0.67, 0.72, 1.00, 1.00, 100);

  createRoughPart(doc, sourceLayer, groups.roughOrnamentGroup, "rough-hair-ribbon-left", 0.16, 0.04, 0.31, 0.16, 100);
  createRoughPart(doc, sourceLayer, groups.roughOrnamentGroup, "rough-hair-ribbon-right", 0.69, 0.04, 0.84, 0.16, 100);
  createRoughPart(doc, sourceLayer, groups.roughOrnamentGroup, "rough-earring-left", 0.29, 0.20, 0.40, 0.33, 100);
  createRoughPart(doc, sourceLayer, groups.roughOrnamentGroup, "rough-earring-right", 0.60, 0.20, 0.71, 0.33, 100);

  createRoughPart(doc, sourceLayer, groups.roughEyebrowGroup, "rough-eyebrow-left", 0.34, 0.11, 0.47, 0.18, 100);
  createRoughPart(doc, sourceLayer, groups.roughEyebrowGroup, "rough-eyebrow-right", 0.53, 0.11, 0.66, 0.18, 100);

  createRoughPart(doc, sourceLayer, groups.roughEyeLeftGroup, "rough-eye-left", 0.30, 0.14, 0.49, 0.26, 100);
  createRoughPart(doc, sourceLayer, groups.roughEyeRightGroup, "rough-eye-right", 0.51, 0.14, 0.70, 0.26, 100);
  createRoughPart(doc, sourceLayer, groups.roughMouthGroup, "rough-mouth", 0.42, 0.23, 0.58, 0.33, 100);

  createRoughPart(doc, sourceLayer, groups.roughBodyGroup, "rough-neck", 0.43, 0.33, 0.58, 0.42, 100);
  createRoughPart(doc, sourceLayer, groups.roughBodyGroup, "rough-torso", 0.24, 0.31, 0.76, 0.63, 100);
  createRoughPart(doc, sourceLayer, groups.roughBodyGroup, "rough-hand-left", 0.28, 0.33, 0.53, 0.56, 100);
  createRoughPart(doc, sourceLayer, groups.roughBodyGroup, "rough-hand-right", 0.73, 0.49, 0.92, 0.73, 100);
  createRoughPart(doc, sourceLayer, groups.roughBodyGroup, "rough-leg-left", 0.38, 0.65, 0.52, 0.98, 100);
  createRoughPart(doc, sourceLayer, groups.roughBodyGroup, "rough-leg-right", 0.52, 0.65, 0.64, 0.98, 100);

  createRoughPart(doc, sourceLayer, groups.roughDressGroup, "rough-collar", 0.31, 0.29, 0.69, 0.38, 100);
  createRoughPart(doc, sourceLayer, groups.roughDressGroup, "rough-bow-main", 0.36, 0.29, 0.65, 0.41, 100);
  createRoughPart(doc, sourceLayer, groups.roughDressGroup, "rough-bodice", 0.26, 0.32, 0.74, 0.58, 100);
  createRoughPart(doc, sourceLayer, groups.roughDressGroup, "rough-sleeve-left", 0.08, 0.31, 0.34, 0.62, 100);
  createRoughPart(doc, sourceLayer, groups.roughDressGroup, "rough-sleeve-right", 0.66, 0.32, 0.96, 0.62, 100);
  createRoughPart(doc, sourceLayer, groups.roughDressGroup, "rough-skirt-front", 0.17, 0.46, 0.83, 0.80, 100);
  createRoughPart(doc, sourceLayer, groups.roughDressGroup, "rough-underskirt-frill", 0.21, 0.66, 0.81, 0.83, 100);

  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-camera-body", 0.37, 0.39, 0.63, 0.58, 100);
  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-strap-left", 0.29, 0.28, 0.44, 0.61, 100);
  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-strap-right", 0.56, 0.28, 0.71, 0.61, 100);
  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-tassel", 0.29, 0.50, 0.40, 0.68, 100);
  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-sock-left", 0.33, 0.84, 0.49, 0.98, 100);
  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-sock-right", 0.54, 0.84, 0.69, 0.98, 100);
  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-shoe-left", 0.28, 0.92, 0.51, 1.00, 100);
  createRoughPart(doc, sourceLayer, groups.roughAccessoryGroup, "rough-shoe-right", 0.50, 0.92, 0.72, 1.00, 100);
}

var outputPath = configOrDefault("outputPath", envOrDefault("MIRA_OUTPUT_PSD", ""));
if (!outputPath) {
  throw new Error("MIRA_OUTPUT_PSD is required");
}

var documentName = configOrDefault("documentName", envOrDefault("MIRA_DOC_NAME", "Mira_Live2D_Template"));
var width = Number(configOrDefault("width", envOrDefault("MIRA_DOC_WIDTH", "6144")));
var height = Number(configOrDefault("height", envOrDefault("MIRA_DOC_HEIGHT", "8192")));
var resolution = Number(configOrDefault("resolution", envOrDefault("MIRA_DOC_RESOLUTION", "300")));
var referencePaths = typeof MIRA_CONFIG !== "undefined" && MIRA_CONFIG && MIRA_CONFIG.referencePaths
  ? MIRA_CONFIG.referencePaths
  : splitReferencePaths(envOrDefault("MIRA_REFERENCE_PATHS", envOrDefault("MIRA_REFERENCE_PATH", "")));

var doc = app.documents.add(width, height, resolution, documentName, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
var groups = buildLayerTree(doc);
var referenceSetup = placeReferences(doc, groups, referencePaths);
createAutoSplitLayers(doc, groups, referenceSetup ? referenceSetup.portraitReference : null);

var saveOptions = new PhotoshopSaveOptions();
saveOptions.alphaChannels = true;
saveOptions.annotations = false;
saveOptions.embedColorProfile = true;
saveOptions.layers = true;
saveOptions.maximizeCompatibility = true;
saveOptions.spotColors = false;

doc.saveAs(new File(outputPath), saveOptions, false, Extension.LOWERCASE);
