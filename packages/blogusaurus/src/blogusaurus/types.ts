import type { Value } from 'platejs';

/** Serialized rich-text document. This is what you store in your database (as JSON). */
export type BlogusaurusContent = Value;

export type BlogusaurusStatus = 'draft' | 'published';

/** Bump when the stored shape changes so old rows can be migrated. */
export const BLOGUSAURUS_SCHEMA_VERSION = 1;

export type BlogusaurusPost = {
  /** Schema version this post was written with. */
  version?: number;
  id?: string;
  title: string;
  /** Short summary shown in listings / meta description. */
  excerpt: string;
  slug: string;
  tags: string[];
  coverImage?: { url: string; alt?: string };
  status: BlogusaurusStatus;
  content: BlogusaurusContent;
};

export type BlogusaurusUploadKind = 'image' | 'video' | 'audio' | 'file' | 'cover';

export type BlogusaurusUploadResult = {
  /** Publicly reachable URL that will be stored in the content. */
  url: string;
  name?: string;
  size?: number;
  type?: string;
};

export type BlogusaurusUploadContext = {
  kind: BlogusaurusUploadKind;
  onProgress: (percent: number) => void;
};

/**
 * Everything the creator needs from your backend. All optional: features
 * that need a missing handler are disabled or fall back gracefully
 * (e.g. no `onUploadFile` -> media can only be embedded by URL).
 */
export type BlogusaurusHandlers = {
  /** Persist the post. Called by "Save draft" and by autosave. Return the saved post (e.g. with an id) if you want it merged back. */
  onSave?: (post: BlogusaurusPost) => Promise<BlogusaurusPost | void> | BlogusaurusPost | void;
  /** Called by the "Publish" button. The post has `status: 'published'`. */
  onPublish?: (post: BlogusaurusPost) => Promise<BlogusaurusPost | void> | BlogusaurusPost | void;
  /** Upload a file to your storage and return its public URL. */
  onUploadFile?: (
    file: File,
    ctx: BlogusaurusUploadContext
  ) => Promise<BlogusaurusUploadResult>;
  /** Fires on every edit with the latest post. */
  onChange?: (post: BlogusaurusPost) => void;
  onError?: (error: unknown) => void;
};
