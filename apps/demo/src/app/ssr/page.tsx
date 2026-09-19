// A Server Component: BlogusaurusRender ships no editor runtime and needs no client JS.
import Link from "next/link";
import { BlogusaurusRender, type BlogusaurusPost } from "blogusaurus/render";

const t = (text: string, marks: Record<string, boolean> = {}) => ({ text, ...marks });

const post: BlogusaurusPost = {
  version: 1,
  title: "Rendered on the server",
  excerpt: "This page is a React Server Component reading stored JSON.",
  slug: "rendered-on-the-server",
  tags: ["ssr", "demo"],
  status: "published",
  content: [
    { type: "h2", children: [t("Rich text")] },
    {
      type: "p",
      children: [
        t("Bold ", { bold: true }),
        t("italic ", { italic: true }),
        t("code", { code: true }),
        t(" and a "),
        { type: "a", url: "https://platejs.org", children: [t("link")] },
        t("."),
      ],
    },
    { type: "blockquote", children: [t("Stored as JSON, rendered as HTML.")] },
    { type: "p", indent: 1, listStyleType: "disc", children: [t("A bulleted item")] },
    { type: "p", indent: 1, listStyleType: "disc", children: [t("Another item")] },
    {
      type: "code_block",
      lang: "ts",
      children: [
        { type: "code_line", children: [t("const answer: number = 42;")] },
        { type: "code_line", children: [t("console.log(answer);")] },
      ],
    },
    { type: "equation", texExpression: "e^{i\\pi} + 1 = 0", children: [t("")] },
    { type: "hr", children: [t("")] },
    { type: "p", children: [t("The end.")] },
  ],
};

export default function SsrPage() {
  return (
    <div className="demo-ssr">
      <p>
        <Link href="/">← Back to the creator</Link> · rendered by a Server Component.
      </p>
      <BlogusaurusRender post={post} />
    </div>
  );
}
