import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';

// Componente para bloques de código
const CodeBlock = ({ code, language, isDark }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className={`my-4 rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} px-4 py-2 flex justify-between items-center`}>
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {language || 'código'}
        </span>
        <button
          onClick={handleCopy}
          className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} focus:outline-none`}
          aria-label="Copiar código"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </button>
      </div>
      <pre className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-4 overflow-x-auto`}>
        <code className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{code}</code>
      </pre>
    </div>
  );
};

const MarkdownRenderer = ({ content, isDark }) => {
  return (
    <ReactMarkdown
      components={{
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <CodeBlock 
              code={String(children).replace(/\n$/, '')} 
              language={match[1]} 
              isDark={isDark}
            />
          ) : (
            <code 
              className={`${className} px-1 py-0.5 ${
                isDark 
                  ? 'bg-gray-700 text-orange-400' 
                  : 'bg-gray-100 text-orange-600'
              } rounded`} 
              {...props}
            >
              {children}
            </code>
          );
        },
        h1: ({ node, ...props }) => (
          <h1 
            className={`text-2xl font-bold mt-6 mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} 
            {...props} 
          />
        ),
        h2: ({ node, ...props }) => (
          <h2 
            className={`text-xl font-bold mt-6 mb-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} 
            {...props} 
          />
        ),
        h3: ({ node, ...props }) => (
          <h3 
            className={`text-lg font-bold mt-5 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`} 
            {...props} 
          />
        ),
        h4: ({ node, ...props }) => (
          <h4 
            className={`text-base font-bold mt-4 mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}
            {...props} 
          />
        ),
        p: ({ node, ...props }) => (
          <p className="mb-4 whitespace-pre-wrap break-words" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-6 mb-4" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-6 mb-4" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="mb-1" {...props} />
        ),
        blockquote: ({ node, ...props }) => (
          <blockquote
            className={`border-l-4 ${
              isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
            } pl-4 italic my-4`}
            {...props}
          />
        ),
        a: ({ node, ...props }) => (
          <a 
            className={`${isDark ? 'text-orange-400' : 'text-orange-600'} hover:underline`} 
            {...props} 
            target="_blank"
            rel="noopener noreferrer"
          />
        ),
        img: ({ node, ...props }) => (
          <img className="max-w-full h-auto my-4 rounded" {...props} alt={props.alt || ""} />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table 
              className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}
              {...props} 
            />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className={isDark ? 'bg-gray-800' : 'bg-gray-50'} {...props} />
        ),
        th: ({ node, ...props }) => (
          <th
            className={`px-6 py-3 text-left text-xs font-medium ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            } uppercase tracking-wider`}
            {...props}
          />
        ),
        tbody: ({ node, ...props }) => (
          <tbody 
            className={`${isDark ? 'bg-gray-900' : 'bg-white'} divide-y ${
              isDark ? 'divide-gray-700' : 'divide-gray-200'
            }`}
            {...props} 
          />
        ),
        tr: ({ node, ...props }) => (<tr {...props} />),
        td: ({ node, ...props }) => (
          <td className="px-6 py-4 whitespace-nowrap" {...props} />
        ),
        hr: ({ node, ...props }) => (
          <hr 
            className={`my-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
            {...props} 
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;