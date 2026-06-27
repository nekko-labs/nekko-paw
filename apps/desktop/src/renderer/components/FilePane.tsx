import React, { useEffect, useRef, useState } from 'react';
import { Markdown } from './Markdown.js';
import { FileTypeIcon } from '../fileIcons.js';
import { ExternalIcon } from '../icons.js';

/**
 * Built-in file viewer/editor. Markdown renders (with a Source/Preview toggle);
 * other text files open in a lightweight mono editor you can edit and save
 * in-app. Binary/oversized files show a notice. Deliberately not a full IDE —
 * just enough to read and tweak files without leaving Open Paw.
 */
export function FilePane({ path }: { path: string }) {
  const isMd = /\.(md|markdown)$/i.test(path);
  const name = path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || path;

  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [binary, setBinary] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(isMd); // markdown defaults to rendered
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    setLoaded(false);
    window.nekko.readFile(path).then((f) => {
      if (!live) return;
      setContent(f.content);
      setBinary(f.binary);
      setTruncated(f.truncated);
      setDirty(false);
      setLoaded(true);
    }).catch(() => { if (live) { setLoaded(true); setBinary(false); } });
    return () => { live = false; };
  }, [path]);

  const save = async () => {
    if (!dirty || truncated) return;
    setSaving(true);
    try {
      await window.nekko.writeFile(path, content);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: 'var(--paper)' }}>
      <div className="flex items-center gap-2 border-b border-line px-3 py-1.5 text-[12px]">
        <FileTypeIcon name={name} size={15} />
        <span className="font-medium">{name}</span>
        {dirty && <span className="h-1.5 w-1.5 rounded-full bg-accent" title="Unsaved changes" />}
        <span className="ml-auto flex items-center gap-1">
          {isMd && (
            <button className="chip text-[11px]" onClick={() => setPreview((p) => !p)}>
              {preview ? 'Source' : 'Preview'}
            </button>
          )}
          {!binary && !truncated && (
            <button className="btn btn-ghost px-2 py-0.5 text-[11px]" onClick={save} disabled={!dirty || saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button className="rounded p-1 text-ink-faint hover:text-ink" title="Reveal in OS"
            onClick={() => window.nekko.openPath(path)}><ExternalIcon className="h-3.5 w-3.5" /></button>
        </span>
      </div>

      {truncated && (
        <div className="border-b border-line px-3 py-1 text-[11px] text-amber-500">
          Large file — showing the first part only; editing is disabled.
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        {!loaded ? (
          <p className="p-4 text-[12px] text-ink-faint">Loading…</p>
        ) : binary ? (
          <p className="p-4 text-[12px] text-ink-faint">Binary file — can't display as text.</p>
        ) : isMd && preview ? (
          <div className="px-5 py-4"><Markdown text={content} /></div>
        ) : (
          <textarea
            ref={taRef}
            className="h-full w-full resize-none bg-transparent p-3 font-mono text-[12.5px] leading-relaxed outline-none"
            spellCheck={false}
            value={content}
            readOnly={truncated}
            onKeyDown={onKeyDown}
            onChange={(e) => { setContent(e.target.value); setDirty(true); }}
          />
        )}
      </div>
    </div>
  );
}
