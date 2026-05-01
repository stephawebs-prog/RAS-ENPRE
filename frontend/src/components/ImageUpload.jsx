import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

/**
 * Image upload that:
 * - Accepts files up to `maxSizeKb` (default 4000KB = 4MB original).
 * - Client-side downscales + compresses JPEG so the stored data URL stays small
 *   (~200-300KB) — safe for JSON payloads & MongoDB.
 * Props:
 *  - value: base64/url string
 *  - onChange: (dataUrl) => void
 *  - label, hint, aspect ("square" | "wide")
 */
const ImageUpload = ({ value, onChange, label, hint, aspect = "square", maxSizeKb = 4000, testid = "image-upload" }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const compressImage = (file, targetAspect) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Max output dimensions — keeps payload small
          const maxW = targetAspect === "wide" ? 1200 : 600;
          const maxH = targetAspect === "wide" ? 400 : 600;
          let w = img.width;
          let h = img.height;
          const ratio = Math.min(maxW / w, maxH / h, 1);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          // Start at 0.85 and reduce if still too large
          let quality = 0.85;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length > 300 * 1024 && quality > 0.3) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = async (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Solo imágenes (JPG, PNG, WebP)"); return; }
    const sizeKb = file.size / 1024;
    if (sizeKb > maxSizeKb) {
      setError(`Imagen muy grande (${Math.round(sizeKb)}KB). Máximo ${maxSizeKb}KB.`);
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await compressImage(file, aspect);
      onChange(dataUrl);
    } catch (err) {
      setError("No se pudo procesar la imagen. Intenta con otra.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const aspectCls = aspect === "wide" ? "aspect-[3/1]" : "aspect-square w-32";

  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-teal block mb-1">{label}</label>
      {hint && <p className="text-xs text-teal-soft mb-2">{hint}</p>}
      <div className="flex items-start gap-3">
        <div
          onClick={() => inputRef.current?.click()}
          className={`${aspectCls} ${aspect === "wide" ? "w-full" : ""} bg-cream rounded-2xl border-2 border-dashed border-gray-300 hover:border-orange transition-colors cursor-pointer overflow-hidden flex items-center justify-center relative group`}
        >
          {loading ? (
            <div className="text-teal-soft text-center p-3 text-xs">Comprimiendo…</div>
          ) : value ? (
            <>
              <img src={value} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center shadow"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <div className="text-teal-soft text-center p-3">
              <Upload size={20} className="mx-auto mb-1" />
              <span className="text-xs">Subir imagen</span>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
          data-testid={testid}
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default ImageUpload;
