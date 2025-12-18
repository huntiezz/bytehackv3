"use client";

import React from "react";

interface CodeBlockProps {
  code: string;
}

function detectLanguage(code: string): 'cpp' | 'c' | 'text' {
  const cppKeywords = /\b(std::|namespace|class|template|typename|constexpr|nullptr|auto)\b/;
  const cKeywords = /\b(struct|typedef|void|int|char|float|double|unsigned|signed|#include|#define)\b/;
  
  if (cppKeywords.test(code)) return 'cpp';
  if (cKeywords.test(code)) return 'c';
  return 'text';
}

function highlightCpp(code: string): React.ReactElement[] {
  const lines = code.split('\n');
  
  return lines.map((line, index) => {
    if (line.trim().startsWith('//')) {
      return (
        <div key={index}>
          <span className="text-green-500">{line}</span>
        </div>
      );
    }
    
    let highlighted = line;
    
    const keywords = ['std', 'int', 'char', 'void', 'unsigned', 'signed', 'struct', 'class', 'namespace', 'return', 'if', 'else', 'for', 'while', 'constexpr', 'auto', 'typedef', 'enum', 'union', 'const', 'static', 'extern', 'template', 'typename'];
    const types = ['int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', '__int64', 'UINT64', 'DWORD', 'BYTE', 'size_t', 'uintptr_t'];
    
    const parts: React.ReactElement[] = [];
    let currentPos = 0;
    
    const tokenRegex = /\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(\w+)\b|([{}();,=+\-*/<>!&|])/g;
    let match;
    
    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > currentPos) {
        parts.push(<span key={`text-${index}-${currentPos}`}>{line.substring(currentPos, match.index)}</span>);
      }
      
      const token = match[0];
      
      if (token.startsWith('//')) {
        parts.push(<span key={`comment-${index}-${match.index}`} className="text-green-500">{token}</span>);
      }
      else if (token.startsWith('"') || token.startsWith("'")) {
        parts.push(<span key={`string-${index}-${match.index}`} className="text-orange-400">{token}</span>);
      }
      else if (match[1] && keywords.includes(match[1])) {
        parts.push(<span key={`keyword-${index}-${match.index}`} className="text-purple-400">{token}</span>);
      }
      else if (match[1] && types.includes(match[1])) {
        parts.push(<span key={`type-${index}-${match.index}`} className="text-blue-400">{token}</span>);
      }
      else if (match[1] && /^(0x[0-9A-Fa-f]+|\d+)$/.test(match[1])) {
        parts.push(<span key={`number-${index}-${match.index}`} className="text-yellow-400">{token}</span>);
      }
      else if (match[2]) {
        parts.push(<span key={`operator-${index}-${match.index}`} className="text-gray-400">{token}</span>);
      }
      else {
        parts.push(<span key={`default-${index}-${match.index}`} className="text-gray-300">{token}</span>);
      }
      
      currentPos = match.index + token.length;
    }
    
    if (currentPos < line.length) {
      parts.push(<span key={`end-${index}`}>{line.substring(currentPos)}</span>);
    }
    
    return <div key={index}>{parts.length > 0 ? parts : <span>{line || ' '}</span>}</div>;
  });
}

export function CodeBlock({ code }: CodeBlockProps) {
  const language = detectLanguage(code);
  
  if (language === 'cpp' || language === 'c') {
    return (
      <pre className="overflow-x-auto text-xs font-mono leading-snug">
        <code className="language-cpp">
          {highlightCpp(code)}
        </code>
      </pre>
    );
  }
  
  return (
    <pre className="overflow-x-auto text-xs font-mono leading-snug text-gray-300">
      <code>
        {code}
      </code>
    </pre>
  );
}
