import * as React from 'react';

import type { BlogusaurusPost } from '@/blogusaurus';

// Demo persistence: the host app owns storage. Swap these for fetch() calls to your API.
const KEY = 'blogusaurus:demo-post';
const EVENT = 'blogusaurus:demo-post-changed';

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);

  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/** `undefined` on the server / first paint, then the raw stored JSON (or null). */
export function useStoredPostJson() {
  return React.useSyncExternalStore<string | null | undefined>(
    subscribe,
    () => localStorage.getItem(KEY),
    () => undefined
  );
}

export function savePost(post: BlogusaurusPost): BlogusaurusPost {
  const saved = { ...post, id: post.id ?? crypto.randomUUID() };

  // Throws when the quota is exceeded (e.g. large data-URL uploads); the creator surfaces it as "Save failed".
  localStorage.setItem(KEY, JSON.stringify(saved));
  window.dispatchEvent(new Event(EVENT));

  return saved;
}

export function clearPost() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

/** Stand-in for uploading to S3 / Cloudinary / your API: returns a data URL. */
export function fakeUpload(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ url: string; name: string; size: number; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Upload failed'));
    reader.onload = () =>
      resolve({
        url: reader.result as string,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    reader.readAsDataURL(file);
  });
}
