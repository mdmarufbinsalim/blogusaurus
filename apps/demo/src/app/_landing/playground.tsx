"use client";

import { useEffect, useState } from "react";
import { BlogusaurusCreator, BlogusaurusRender, type BlogusaurusPost } from "blogusaurus";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";

import { samplePost } from "./sample";
import { theme } from "./theme";
import { fakeSave, fakeUpload } from "./upload";

type Tab = "write" | "read";

export function Playground() {
  const [tab, setTab] = useState<Tab>("write");
  const [full, setFull] = useState(false);
  // The renderer shows whatever the creator last reported.
  const [post, setPost] = useState<BlogusaurusPost>(samplePost);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full]);

  return (
    // The slot keeps the page layout stable while the frame is fullscreen.
    <div className="pg-slot">
      <div className={full ? "pg pg--full" : "pg"}>
        <div className="pg-bar">
          <div className="pg-tabs" role="tablist" aria-label="Demo">
            {(["write", "read"] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
              >
                {id === "write" ? "Creator" : "Renderer"}
              </button>
            ))}
          </div>
          <div className="pg-bar-right">
            {full && <span className="pg-hint">Esc to exit</span>}
            <button
              type="button"
              className="pg-icon"
              aria-label={full ? "Exit full screen" : "Full screen"}
              onClick={() => setFull((f) => !f)}
            >
              {full ? <Minimize2Icon size={16} /> : <Maximize2Icon size={16} />}
              <span>{full ? "Exit" : "Full screen"}</span>
            </button>
          </div>
        </div>

        <div className="pg-body">
          <div className="pg-pane" hidden={tab !== "write"}>
            <BlogusaurusCreator
              theme={theme}
              initialPost={samplePost}
              onChange={setPost}
              onSave={fakeSave}
              onPublish={fakeSave}
              onUploadFile={(file, { onProgress }) => fakeUpload(file, onProgress)}
            />
          </div>
          {tab === "read" && (
            <div className="pg-pane pg-scroll">
              <BlogusaurusRender post={post} theme={theme} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
