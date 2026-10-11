// Preserve the established 390 × 844 portrait framing in CSS pixels. Other
// viewport sizes reveal more/less of the field instead of zooming the actors.
export const FIELD_CAMERA = Object.freeze({
  referenceHeight: 844,
  referenceFov: 42,
  offset: Object.freeze({x: .53 * 28, y: .42 * 28, z: .74 * 28}),
  lookHeight: 1.3,
  follow: .94,
  followSpeed: 7,
});
const focalPixels = FIELD_CAMERA.referenceHeight / (2 * Math.tan(FIELD_CAMERA.referenceFov * Math.PI / 360));

export function resizeFieldCamera(camera, width, height, tutorialActive = false) {
  // Mobile rotation/background transitions may briefly report 0/1px. Keep
  // the last valid projection instead of committing an extreme, transient FOV.
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 2 || height < 2) return false;
  const w = width, h = height;
  camera.aspect = w / h;
  camera.fov = 2 * Math.atan(h / (2 * focalPixels)) * 180 / Math.PI;
  // This shifts the framing below the lesson card without changing its scale.
  const lessonOffset = tutorialActive && w / h < .7 ? Math.max(0, Math.min(h * .24, 490 - h / 2)) : 0;
  if (lessonOffset) camera.setViewOffset(w, h, 0, -lessonOffset, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  return true;
}
