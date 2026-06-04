'use client';

import { useState } from 'react';
import { useToast } from '@/components/shared/Toast';

interface ScreenshotUploaderProps {
  screenshots: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function ScreenshotUploader({
  screenshots,
  onChange,
  maxFiles = 5,
}: ScreenshotUploaderProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (screenshots.length + files.length > maxFiles) {
      toast.warning(`You can only upload up to ${maxFiles} screenshots.`);
      return;
    }

    setUploading(true);
    try {
      const newUrls = [...screenshots];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newUrls.push(data.url);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      onChange(newUrls);
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (indexToRemove: number) => {
    const newUrls = screenshots.filter((_, idx) => idx !== indexToRemove);
    onChange(newUrls);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2">
        {screenshots.map((url, idx) => (
          <div key={idx} className="relative aspect-video bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Screenshot ${idx + 1}`} className="object-cover w-full h-full" />
            <button
              type="button"
              onClick={() => removeScreenshot(idx)}
              className="absolute top-1.5 right-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-1 text-[10px] w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
        {screenshots.length < maxFiles && (
          <label className="border-2 border-dashed border-[var(--color-border)] rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-[var(--color-accent)] transition-colors bg-[var(--color-surface)] min-h-[80px]">
            <span className="text-xl">📷</span>
            <span className="text-[10px] text-[var(--color-text-muted)] mt-1">
              {uploading ? 'Uploading...' : 'Add Screenshot'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)]">
        Upload up to {maxFiles} screenshots (PNG, JPG, WebP) showing entry, confluences, or exit.
      </p>
    </div>
  );
}
