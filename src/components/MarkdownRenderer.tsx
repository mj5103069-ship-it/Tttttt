import React, { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { GroundingSource } from "../types";

interface MarkdownRendererProps {
  content: string;
  sources?: GroundingSource[];
  onCitationClick?: (source: GroundingSource) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  sources = [],
  onCitationClick,
}) => {
  if (!content) return null;

  // Split content into code blocks and normal text blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-sm leading-relaxed text-slate-100">
      {parts.map((part, index) => {
        // Code block
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const language = match ? match[1] || "code" : "code";
          const code = match ? match[2].trim() : part.slice(3, -3).trim();
          return (
            <CodeBlock key={index} language={language} code={code} />
          );
        }

        // Normal text block - parse line-by-line for headings, lists, quotes, etc.
        return (
          <div key={index} className="space-y-2">
            {renderTextBlock(part, sources, onCitationClick)}
          </div>
        );
      })}
    </div>
  );
};

// Custom Code Block component with Copy button
const CodeBlock: React.FC<{ language: string; code: string }> = ({
  language,
  code,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-slate-700 bg-slate-900/90 shadow-lg">
      <div className="flex items-center justify-between bg-slate-850 px-4 py-1.5 text-xs font-mono text-slate-400 border-b border-slate-800">
        <span className="uppercase text-[10px] tracking-wider font-semibold text-indigo-400">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-750"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 font-mono text-xs leading-5 text-slate-300">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
};

// Parse a single text block into styled paragraphs, headings, and lists
function renderTextBlock(
  text: string,
  sources: GroundingSource[],
  onCitationClick?: (source: GroundingSource) => void
): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { items: React.ReactNode[]; type: "ordered" | "unordered" } | null = null;

  const pushCurrentList = (key: number) => {
    if (currentList) {
      if (currentList.type === "ordered") {
        elements.push(
          <ol key={`list-${key}`} className="list-decimal pl-5 space-y-1 my-2 text-slate-250">
            {currentList.items}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-5 space-y-1 my-2 text-slate-250">
            {currentList.items}
          </ul>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Headings
    if (line.startsWith("# ")) {
      pushCurrentList(i);
      elements.push(
        <h1 key={i} className="text-xl font-bold text-slate-50 mt-4 mb-2 font-display">
          {parseInline(line.substring(2), sources, onCitationClick)}
        </h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      pushCurrentList(i);
      elements.push(
        <h2 key={i} className="text-lg font-semibold text-slate-100 mt-3 mb-1.5 font-display">
          {parseInline(line.substring(3), sources, onCitationClick)}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      pushCurrentList(i);
      elements.push(
        <h3 key={i} className="text-base font-medium text-slate-200 mt-2.5 mb-1 font-display">
          {parseInline(line.substring(4), sources, onCitationClick)}
        </h3>
      );
      continue;
    }

    // 2. Blockquotes
    if (line.startsWith("> ")) {
      pushCurrentList(i);
      elements.push(
        <blockquote key={i} className="border-l-4 border-indigo-500 bg-slate-800/40 px-4 py-2 my-2 rounded-r italic text-slate-300">
          {parseInline(line.substring(2), sources, onCitationClick)}
        </blockquote>
      );
      continue;
    }

    // 3. Lists
    const unorderedMatch = line.match(/^[\*\-\+]\s+(.*)/);
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);

    if (unorderedMatch) {
      const itemContent = unorderedMatch[1];
      if (!currentList || currentList.type !== "unordered") {
        pushCurrentList(i);
        currentList = { items: [], type: "unordered" };
      }
      currentList.items.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInline(itemContent, sources, onCitationClick)}
        </li>
      );
      continue;
    }

    if (orderedMatch) {
      const itemContent = orderedMatch[2];
      if (!currentList || currentList.type !== "ordered") {
        pushCurrentList(i);
        currentList = { items: [], type: "ordered" };
      }
      currentList.items.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {parseInline(itemContent, sources, onCitationClick)}
        </li>
      );
      continue;
    }

    // Empty line triggers closing the list
    if (line.trim() === "") {
      pushCurrentList(i);
      continue;
    }

    // 4. Default paragraph
    pushCurrentList(i);
    elements.push(
      <p key={i} className="leading-relaxed text-slate-200">
        {parseInline(line, sources, onCitationClick)}
      </p>
    );
  }

  // End of text check
  pushCurrentList(lines.length);

  return elements;
}

// Parse inline formatting: Bold, Italic, Inline Code, and Citations [1]
function parseInline(
  text: string,
  sources: GroundingSource[],
  onCitationClick?: (source: GroundingSource) => void
): React.ReactNode[] {
  // Regex pattern for inline code, bold, italic, and citations
  // Match `code`, **bold**, *italic*, [n] where n is number
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\])/g;
  const segments = text.split(regex);

  return segments.map((seg, idx) => {
    // 1. Inline Code
    if (seg.startsWith("`") && seg.endsWith("`")) {
      return (
        <code
          key={idx}
          className="mx-0.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300 border border-slate-700/60"
        >
          {seg.substring(1, seg.length - 1)}
        </code>
      );
    }

    // 2. Bold
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {seg.substring(2, seg.length - 2)}
        </strong>
      );
    }

    // 3. Italic
    if (seg.startsWith("*") && seg.endsWith("*")) {
      return (
        <em key={idx} className="italic text-slate-300">
          {seg.substring(1, seg.length - 1)}
        </em>
      );
    }

    // 4. Grounding Citations: [1], [2]
    if (seg.startsWith("[") && seg.endsWith("]") && /^\d+$/.test(seg.slice(1, -1))) {
      const sourceIndex = parseInt(seg.slice(1, -1), 10) - 1;
      const source = sources[sourceIndex];
      if (source) {
        return (
          <button
            key={idx}
            onClick={() => onCitationClick?.(source)}
            className="mx-0.5 inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-indigo-900/50 hover:bg-indigo-800/80 text-[11px] font-semibold text-indigo-300 border border-indigo-700/50 cursor-pointer hover:text-white transition-all transform hover:scale-105"
            title={source.title}
          >
            {seg}
            <ExternalLink size={8} />
          </button>
        );
      }
    }

    // Default regular text
    return seg;
  });
}
