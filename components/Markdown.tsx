'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Markdown renderer — styling comes from the md-* classes in globals.css. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="md-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" className="md-a" />,
          p: (props) => <p {...props} className="md-p" />,
          h1: (props) => <h1 {...props} className="md-h1" />,
          h2: (props) => <h2 {...props} className="md-h2" />,
          h3: (props) => <h3 {...props} className="md-h3" />,
          h4: (props) => <h4 {...props} className="md-h4" />,
          ul: (props) => <ul {...props} className="md-ul" />,
          ol: (props) => <ol {...props} className="md-ol" />,
          li: (props) => <li {...props} className="md-li" />,
          strong: (props) => <strong {...props} className="md-strong" />,
          code: (props) => <code {...props} className="md-code-inline" />,
          pre: (props) => <pre {...props} className="md-pre" />,
          table: (props) => (
            <div className="md-table-wrap">
              <table {...props} className="md-table" />
            </div>
          ),
          th: (props) => <th {...props} className="md-th" />,
          td: (props) => <td {...props} className="md-td" />,
          blockquote: (props) => <blockquote {...props} className="md-quote" />,
          hr: () => <hr className="md-hr" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
