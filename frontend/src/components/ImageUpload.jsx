import React, { useRef } from "react";
import { Upload, X } from "lucide-react";

/**
 * Image upload that converts a file to a base64 data URL.
 * Props:
 *  - value: base64/url string
 *  - onChange: (dataUrl) => void
 *  - label, hint, aspect ("square" | "wide")
 *  - maxSizeKb (default 800) — auto-rejects files larger
 */
const ImageUpload = ({ value, onChange, label, hint, aspect = "square", maxSizeKb = 800, testid = "image-upload" }) => {
  const inputRef = useRef(null);
  const [error, setError] = React.useState("");

  const handleFile = (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Solo imágenes (JPG, PNG, WebP)"); return; }
    const sizeKb = file.size / 1024;
    if (sizeKb > maxSizeKb) {
      setError(`Imagen muy grande (${Math.round(sizeKb)}KB). Máximo ${maxSizeKb}KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
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
          {value ? (
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
