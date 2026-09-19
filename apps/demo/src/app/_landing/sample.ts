import type { BlogusaurusPost } from "blogusaurus";

const t = (text: string, marks: Record<string, boolean> = {}) => ({ text, ...marks });

export const samplePost: BlogusaurusPost = {
  version: 1,
  title: "Hello, Blogusaurus",
  excerpt: "A rich-text editor and a server-safe renderer. Edit this post, then flip to the Renderer tab.",
  slug: "hello-blogusaurus",
  tags: ["editor", "nextjs"],
  status: "draft",
  content: [
    { type: "h2", children: [t("Write like it's a document")] },
    {
      type: "p",
      children: [
        t("Type "),
        t("/", { code: true }),
        t(" for blocks, select text for "),
        t("bold", { bold: true }),
        t(", "),
        t("italic", { italic: true }),
        t(" and "),
        { type: "a", url: "https://platejs.org", children: [t("links")] },
        t(". Drag blocks by their handle to reorder."),
      ],
    },
    { type: "callout", icon: "💡", children: [t("Everything you make here is plain JSON you can store anywhere.")] },
    { type: "p", indent: 1, listStyleType: "disc", children: [t("Headings, lists, todos, tables")] },
    { type: "p", indent: 1, listStyleType: "disc", children: [t("Code blocks with syntax highlighting")] },
    { type: "p", indent: 1, listStyleType: "disc", children: [t("Images, video, math, columns and more")] },
    {
      type: "code_block",
      lang: "ts",
      children: [
        { type: "code_line", children: [t("const post = await editor.save();")] },
        { type: "code_line", children: [t("await db.posts.insert(post);")] },
      ],
    },
    { type: "equation", texExpression: "e^{i\\pi} + 1 = 0", children: [t("")] },
  ],
};
