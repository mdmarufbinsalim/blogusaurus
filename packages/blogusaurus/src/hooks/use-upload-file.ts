import * as React from 'react';

import { toast } from 'sonner';

import { useBlogusaurusHandlers } from '@/blogusaurus/context';
import type { BlogusaurusUploadResult } from '@/blogusaurus/types';

export type UploadedFile = BlogusaurusUploadResult & { name: string };

interface UseUploadFileProps {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

function kindOf(file: File) {
  if (file.type.startsWith('image/')) return 'image' as const;
  if (file.type.startsWith('video/')) return 'video' as const;
  if (file.type.startsWith('audio/')) return 'audio' as const;
  return 'file' as const;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
}: UseUploadFileProps = {}) {
  const { onUploadFile, onError } = useBlogusaurusHandlers();
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setUploadingFile(file);

    try {
      const res = await onUploadFile!(file, {
        kind: kindOf(file),
        onProgress: (p) => setProgress(Math.min(Math.max(p, 0), 100)),
      });
      const uploaded: UploadedFile = {
        ...res,
        name: res.name ?? file.name,
        size: res.size ?? file.size,
        type: res.type ?? file.type,
      };

      setUploadedFile(uploaded);
      onUploadComplete?.(uploaded);

      return uploaded;
    } catch (error) {
      toast.error(getErrorMessage(error));
      onUploadError?.(error);
      onError?.(error);
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return { isUploading, progress, uploadedFile, uploadFile, uploadingFile };
}

export function getErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong, please try again later.';
}

export function showErrorToast(err: unknown) {
  return toast.error(getErrorMessage(err));
}
