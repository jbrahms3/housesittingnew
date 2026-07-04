// Client-side image resize → JPEG data URL, keeps profile photos small enough
// to store directly in the user document without extra infrastructure.
export async function resizeImageFile(file, { maxSize = 400, quality = 0.85 } = {}) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("That image is over 10MB. Try a smaller one.");
  }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onerror = () => reject(new Error("That image couldn't be loaded."));
    i.onload = () => resolve(i);
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
