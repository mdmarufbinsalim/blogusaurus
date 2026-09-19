'use client';

import type { AnyPluginConfig } from 'platejs';
import { TrailingBlockPlugin } from 'platejs';

import { AlignKit } from '@/components/editor/plugins/align-kit';
import { AutoformatKit } from '@/components/editor/plugins/autoformat-kit';
import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit';
import { BlockMenuKit } from '@/components/editor/plugins/block-menu-kit';
import { BlockPlaceholderKit } from '@/components/editor/plugins/block-placeholder-kit';
import { CalloutKit } from '@/components/editor/plugins/callout-kit';
import { CodeBlockKit } from '@/components/editor/plugins/code-block-kit';
import { ColumnKit } from '@/components/editor/plugins/column-kit';
import { CursorOverlayKit } from '@/components/editor/plugins/cursor-overlay-kit';
import { DateKit } from '@/components/editor/plugins/date-kit';
import { DndKit } from '@/components/editor/plugins/dnd-kit';
import { EmojiKit } from '@/components/editor/plugins/emoji-kit';
import { ExitBreakKit } from '@/components/editor/plugins/exit-break-kit';
import { FloatingToolbarKit } from '@/components/editor/plugins/floating-toolbar-kit';
import { FontKit } from '@/components/editor/plugins/font-kit';
import { FootnoteKit } from '@/components/editor/plugins/footnote-kit';
import { LineHeightKit } from '@/components/editor/plugins/line-height-kit';
import { LinkKit } from '@/components/editor/plugins/link-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { MarkdownKit } from '@/components/editor/plugins/markdown-kit';
import { MathKit } from '@/components/editor/plugins/math-kit';
import { MediaKit } from '@/components/editor/plugins/media-kit';
import { SlashKit } from '@/components/editor/plugins/slash-kit';
import { TableKit } from '@/components/editor/plugins/table-kit';
import { TocKit } from '@/components/editor/plugins/toc-kit';
import { ToggleKit } from '@/components/editor/plugins/toggle-kit';

/**
 * The full interactive editor. Add, remove or swap kits here to change what
 * authors can do; every kit is a plain array of Plate plugins.
 */
export const BlogusaurusEditorKit: AnyPluginConfig[] = [
  ...BlockMenuKit,

  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...TocKit,
  ...MediaKit,
  ...CalloutKit,
  ...ColumnKit,
  ...MathKit,
  ...DateKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...CursorOverlayKit,
  ...DndKit,
  ...EmojiKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...MarkdownKit,
  ...FootnoteKit,

  // UI
  ...BlockPlaceholderKit,
  ...FloatingToolbarKit,
];
