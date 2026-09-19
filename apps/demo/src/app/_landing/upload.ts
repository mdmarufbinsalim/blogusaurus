// Stand-in for your storage (S3, Cloudinary, your API…): returns a data URL.
export function fakeUpload(file: File, onProgress: (percent: number) => void) {
  return new Promise<{ url: string; name: string; size: number; type: string }>(
    (resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100);
      reader.onerror = () => reject(reader.error ?? new Error("Upload failed"));
      reader.onload = () =>
        resolve({ url: reader.result as string, name: file.name, size: file.size, type: file.type });
      reader.readAsDataURL(file);
    }
  );
}

// Stand-in for your API.
export const fakeSave = () => new Promise<void>((resolve) => setTimeout(resolve, 500));
