'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CoachMessageContentProps {
  content: string;
  role: 'user' | 'assistant';
}

export function CoachMessageContent({ content, role }: CoachMessageContentProps) {
  if (role === 'user') {
    return <div className="whitespace-pre-wrap font-sans font-medium">{content}</div>;
  }

  return (
    <div className="coach-markdown font-sans text-text-secondary [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-text [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3:first-child]:mt-0 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:text-text [&_strong]:font-semibold [&_code]:text-success [&_code]:bg-surface-overlay [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[10px] [&_blockquote]:border-l-2 [&_blockquote]:border-success/30 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-tertiary">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
