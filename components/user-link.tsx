"use client";

import Link from "next/link";

interface UserLinkProps {
  username?: string;
  name: string;
  role?: string;
  showRole?: boolean;
  isOP?: boolean;
  useProggyFont?: boolean;
  className?: string;
  level?: number;
  fontStyle?: string;
  nameColor?: string;
  nameParticle?: string;
  nameEffect?: string;
  asPlainText?: boolean;
}

const getFontFamily = (style: string): string => {
  const fontMap: Record<string, string> = {
    'default': 'inherit',
    'mono': 'monospace',
    'serif': 'serif',
    'proggy': "'ProggyCleanTT', monospace",
    'arial': 'Arial, sans-serif',
    'helvetica': 'Helvetica, Arial, sans-serif',
    'times': "'Times New Roman', Times, serif",
    'georgia': 'Georgia, serif',
    'courier': "'Courier New', Courier, monospace",
    'verdana': 'Verdana, Geneva, sans-serif',
    'trebuchet': "'Trebuchet MS', sans-serif",
    'impact': 'Impact, Charcoal, sans-serif',
    'comic': "'Comic Sans MS', cursive, sans-serif",
    'palatino': "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
    'garamond': 'Garamond, serif',
    'bookman': "'Bookman Old Style', serif",
    'candara': 'Candara, sans-serif',
    'consolas': 'Consolas, monospace',
    'monaco': 'Monaco, monospace',
    'lucida': "'Lucida Console', Monaco, monospace",
    'rockwell': 'Rockwell, serif',
    'copperplate': 'Copperplate, Fantasy',
    'brush': "'Brush Script MT', cursive",
  };
  return fontMap[style] || 'inherit';
};

export function UserLink({ username, name, role, showRole = false, isOP = false, useProggyFont = false, className = "", level = 0, fontStyle = 'default', nameColor = '#ffffff', nameParticle, nameEffect = 'none', asPlainText = false }: UserLinkProps) {
  const fontClass = useProggyFont ? 'font-proggy' : '';
  const fontFamily = getFontFamily(fontStyle);
  const effectClass = nameEffect && nameEffect !== 'none' ? `username-effect-${nameEffect}` : '';
  
  const effectsWithCustomColor = ['rainbow', 'gradient', 'electric'];
  const useCustomColor = nameEffect && !effectsWithCustomColor.includes(nameEffect);
  
  if (!username || asPlainText) {
    return (
      <span className={`${fontClass} ${className}`}>
        {showRole && role && role !== 'member' && (
          <span className={role === 'admin' ? 'text-red-500 mr-2' : 'text-primary mr-2'}>
            [{role === 'offset_updater' ? 'UPDATER' : role.toUpperCase()}]
          </span>
        )}
        {level >= 3 && <span className="text-orange-500 mr-2">[MVP]</span>}
        {isOP && <span className="text-primary mr-2">[OP]</span>}
        <span
          className={`${effectClass}`}
          style={{ color: useCustomColor ? nameColor : undefined, fontFamily }}
        >
          {name}
        </span>
      </span>
    );
  }

  return (
    <span className={`${fontClass} ${className}`}>
      {showRole && role && role !== 'member' && (
        <span className={role === 'admin' ? 'text-red-500 mr-2' : 'text-primary mr-2'}>
          [{role === 'offset_updater' ? 'UPDATER' : role.toUpperCase()}]
        </span>
      )}
      {level >= 3 && <span className="text-orange-500 mr-2">[MVP]</span>}
      {isOP && <span className="text-primary mr-2">[OP]</span>}
      <Link 
        href={`/user/${username}`}
        className={`${effectClass} hover:underline hover:text-primary transition-colors`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: useCustomColor ? nameColor : undefined, fontFamily }}
      >
        {name}
      </Link>
    </span>
  );
}
