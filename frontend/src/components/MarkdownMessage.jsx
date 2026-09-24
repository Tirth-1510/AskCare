import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * Preprocesses markdown text to clean up common LLM quirks:
 * - Normalizes '### **Title:**' into '### Title'
 * - Fixes acronym letter bolding like '- **B**ananas' into '- **Bananas**' if needed
 * - Ensures clean line breaks before headings and lists
 */
const normalizeMarkdown = (text) => {
  if (!text) return '';

  let cleaned = text
    // Replace '### **Title:**' or '### **Title**' with '### Title'
    .replace(/^(\s*#{1,6})\s*\*\*([^*]+?)\*\*:?\s*$/gm, '$1 $2')
    // Replace '#### **Title**' patterns
    .replace(/^(\s*#{1,6})\s*\*\*([^*]+?)\*\*/gm, '$1 $2')
    // Fix letter-by-letter acronym bullets like "- **B**ananas" -> "- **Bananas**"
    .replace(/^(\s*[-*]\s*)\*\*([A-Za-z])\*\*([A-Za-z0-9]+)/gm, '$1**$2$3**')
    // Ensure headings have an empty line before them for proper markdown parsing
    .replace(/([^\n])\n(#{1,6}\s+)/g, '$1\n\n$2')
    // Ensure list items followed after normal text have proper separation
    .replace(/([^\n])\n([-*]\s+|\d+\.\s+)/g, '$1\n\n$2');

  return cleaned;
};

/**
 * Extracts clinical disclaimer block from the end of the response
 * so it can be rendered as an authoritative healthcare callout card.
 */
const extractDisclaimer = (rawText) => {
  if (!rawText) return { content: '', disclaimer: null };

  const disclaimerPatterns = [
    /\n*(?:(?:\*{0,2}Disclaimer:?\*{0,2})|(?:\bDisclaimer:?\b))[\s\S]*$/i,
    /\n*\[Disclaimer:?[\s\S]*\]$/i
  ];

  for (const pattern of disclaimerPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      const content = rawText.slice(0, match.index).trim();
      const disclaimer = match[0]
        .replace(/^\s*\*{0,2}Disclaimer:?\*{0,2}\s*/i, '')
        .replace(/^\[Disclaimer:?\s*/i, '')
        .replace(/\]\s*$/, '')
        .trim();
      return { content, disclaimer };
    }
  }

  return { content: rawText, disclaimer: null };
};

export default function MarkdownMessage({ content, isAI = false }) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  // For user messages, keep simple text rendering
  if (!isAI) {
    return (
      <p className="whitespace-pre-wrap text-[14px] sm:text-[15px] font-sans leading-relaxed text-white">
        {content}
      </p>
    );
  }

  const { content: mainContent, disclaimer } = extractDisclaimer(content);
  const formattedMarkdown = normalizeMarkdown(mainContent);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className="relative group/msg">
      {/* Rich Markdown Body */}
      <div className="text-[14.5px] sm:text-[15.5px] font-sans leading-[1.75] text-gray-100 select-text">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Headings with modern visual hierarchy and accents
            h1: ({ node, ...props }) => (
              <h1 className="text-lg sm:text-xl font-bold text-white mt-4 mb-2.5 pb-2 border-b border-gray-800 flex items-center gap-2 tracking-tight" {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-[16px] sm:text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2 text-brand-neon" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-[15px] sm:text-[16.5px] font-semibold text-white mt-3.5 mb-1.5 flex items-center gap-2 text-emerald-400" {...props} />
            ),
            h4: ({ node, ...props }) => (
              <h4 className="text-[14px] sm:text-[15px] font-semibold text-gray-200 mt-3 mb-1" {...props} />
            ),

            // Paragraphs with comfortable line height and spacing
            p: ({ node, ...props }) => (
              <p className="my-2.5 text-gray-200 leading-[1.75]" {...props} />
            ),

            // Bullet Lists with high-visibility emerald markers
            ul: ({ node, ...props }) => (
              <ul className="my-3 space-y-2 pl-5 list-disc marker:text-brand-neon text-gray-200" {...props} />
            ),

            // Numbered Lists with distinct contrast numbers
            ol: ({ node, ...props }) => (
              <ol className="my-3 space-y-2 pl-5 list-decimal marker:text-brand-neon marker:font-semibold text-gray-200" {...props} />
            ),

            // List items with generous padding
            li: ({ node, ...props }) => (
              <li className="pl-1 leading-[1.75] text-gray-200" {...props} />
            ),

            // Bold text with high contrast bright white
            strong: ({ node, ...props }) => (
              <strong className="font-semibold text-white tracking-wide" {...props} />
            ),

            // Italic text
            em: ({ node, ...props }) => (
              <em className="italic text-gray-300" {...props} />
            ),

            // Inline code & code blocks
            code: ({ node, inline, ...props }) => inline ? (
              <code className="px-1.5 py-0.5 rounded-md bg-gray-800/80 text-brand-neon font-mono text-xs border border-gray-700/60" {...props} />
            ) : (
              <pre className="p-3.5 my-3 rounded-xl bg-[#090C11] text-gray-200 font-mono text-xs overflow-x-auto border border-gray-800 shadow-inner">
                <code {...props} />
              </pre>
            ),

            // Blockquotes
            blockquote: ({ node, ...props }) => (
              <blockquote className="border-l-4 border-brand-neon/70 bg-brand-neon/5 pl-4 py-2.5 my-3 rounded-r-xl text-gray-300 italic text-[13.5px] leading-relaxed" {...props} />
            ),

            // Horizontal dividers
            hr: ({ node, ...props }) => (
              <hr className="my-4 border-gray-800/80" {...props} />
            ),

            // Tables
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-3.5 rounded-xl border border-gray-800 shadow-md">
                <table className="w-full text-xs text-left border-collapse" {...props} />
              </div>
            ),
            th: ({ node, ...props }) => (
              <th className="bg-gray-800/90 px-3 py-2 font-semibold text-white border-b border-gray-700" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="px-3 py-2 border-b border-gray-800/50 text-gray-300" {...props} />
            )
          }}
        >
          {formattedMarkdown}
        </ReactMarkdown>
      </div>

      {/* Styled Clinical Disclaimer Card (Production Grade) */}
      {disclaimer && (
        <div className="mt-4 pt-3.5 border-t border-gray-800/80">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 shadow-sm">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[12px] leading-relaxed">
              <span className="font-bold text-amber-300 block mb-0.5 tracking-wide">
                Medical Disclaimer
              </span>
              <span className="text-gray-300/90 leading-normal">
                {disclaimer}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Message Action Footer (Copy button) */}
      <div className="mt-3 pt-2 flex items-center justify-between border-t border-gray-800/40 text-[11px] text-gray-500 select-none">
        <span className="flex items-center gap-1.5 text-gray-400 text-[10px]">
          <Sparkles className="w-3 h-3 text-brand-neon" />
          Evidence-based guidance
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-800/80 text-gray-400 hover:text-white transition-all text-xs cursor-pointer border border-transparent hover:border-gray-700/60"
          title="Copy response"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
