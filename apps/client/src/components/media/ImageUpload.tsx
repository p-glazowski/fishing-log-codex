import { useEffect, useRef, useState } from 'react';
import { UploadCloud, ImagePlus, X, Camera } from 'lucide-react';
import { Button } from '../ui/button';
export function ImageUpload({
  file,
  onChange,
  existing,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  existing?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function pick(next?: File) {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) {
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setError('Images must be 5 MB or smaller.');
      return;
    }
    setError('');
    onChange(next);
  }
  return (
    <div>
      <div
        className="upload"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
      >
        {preview || existing ? (
          <img className="upload-preview" src={preview || existing} alt="Selected upload preview" />
        ) : (
          <UploadCloud size={30} />
        )}
        <strong>{file ? file.name : 'Give your story a photo'}</strong>
        <p>
          Drag an image here, or choose one below.
          <br />
          JPEG, PNG or WebP · up to 5 MB
        </p>
        <div className="upload-actions">
          <Button type="button" variant="outline" onClick={() => input.current?.click()}>
            <ImagePlus size={16} />
            Choose photo
          </Button>
          <Button type="button" variant="outline" onClick={() => camera.current?.click()}>
            <Camera size={16} />
            Take photo
          </Button>
          <input
            ref={camera}
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={(event) => pick(event.target.files?.[0])}
          />

          {file && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onChange(null)}
              aria-label="Remove selected image"
            >
              <X size={18} />
            </Button>
          )}
        </div>
        <input
          ref={input}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
