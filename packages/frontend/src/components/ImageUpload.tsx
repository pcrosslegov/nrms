import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface ReleaseImage {
  id: string;
  fileName: string;
  mimeType: string;
  filePath: string;
  sortOrder: number;
  languages: { imageId: string; languageId: string; alternateName: string }[];
}

function useImages(releaseId: string) {
  return useQuery({
    queryKey: ['images', releaseId],
    queryFn: () => api<ReleaseImage[]>(`/api/releases/${releaseId}/images`),
  });
}

export default function ImageUpload({ releaseId }: { releaseId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: images, isLoading } = useImages(releaseId);
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('nrms_token');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/releases/${releaseId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['images', releaseId] }),
  });

  const deleteImage = useMutation({
    mutationFn: (imageId: string) =>
      api(`/api/releases/${releaseId}/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['images', releaseId] }),
  });

  const saveAlt = useMutation({
    mutationFn: ({ imageId, langId, alt }: { imageId: string; langId: string; alt: string }) =>
      api(`/api/releases/${releaseId}/images/${imageId}/alt/${langId}`, {
        method: 'PUT',
        body: JSON.stringify({ alternateName: alt }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['images', releaseId] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Images
        </h3>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="text-sm text-[#003366] hover:underline"
        >
          {upload.isPending ? 'Uploading...' : '+ Upload image'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
            e.target.value = '';
          }}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !images?.length ? (
        <p className="text-sm text-gray-400 italic">No images uploaded</p>
      ) : (
        <div className="space-y-3">
          {images.map((img) => {
            const enAlt = img.languages.find((l) => l.languageId === 'en')?.alternateName ?? '';
            const altKey = `${img.id}-en`;
            const currentAlt = altTexts[altKey] ?? enAlt;

            return (
              <div
                key={img.id}
                className="flex gap-3 p-2 border border-gray-200 rounded"
              >
                <img
                  src={`/api/files/${img.filePath.replace('-original', '-thumbnail')}`}
                  alt={enAlt}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{img.fileName}</p>
                  <div className="flex gap-1 mt-1">
                    <input
                      value={currentAlt}
                      onChange={(e) =>
                        setAltTexts({ ...altTexts, [altKey]: e.target.value })
                      }
                      placeholder="Alt text (EN)"
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                    />
                    <button
                      onClick={() =>
                        saveAlt.mutate({
                          imageId: img.id,
                          langId: 'en',
                          alt: currentAlt,
                        })
                      }
                      className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this image?')) deleteImage.mutate(img.id);
                  }}
                  className="text-red-400 hover:text-red-600 text-xs self-start"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
