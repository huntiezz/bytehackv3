"use client";

interface StyledUsernameProps {
  name: string;
  nameColor?: string;
  fontStyle?: string;
  nameParticle?: string;
  nameEffect?: string;
  level?: number;
  role?: string;
  isOP?: boolean;
  className?: string;
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

export function StyledUsername({
  name,
  nameColor = '#ffffff',
  fontStyle = 'default',
  nameParticle,
  nameEffect = 'none',
  level = 0,
  role,
  isOP = false,
  className = ''
}: StyledUsernameProps) {
  const fontFamily = getFontFamily(fontStyle);
  const effectClass = nameEffect && nameEffect !== 'none' ? `username-effect-${nameEffect}` : '';

  const effectsWithCustomColor = ['rainbow', 'gradient', 'electric'];
  const useCustomColor = nameEffect && !effectsWithCustomColor.includes(nameEffect);

  return (
    <span className={`font-proggy text-sm font-medium ${className}`}>
      {role === 'admin' && (
        <span className="text-red-500 mr-2">[ADMIN]</span>
      )}
      {role === 'offset_updater' && (
        <span className="text-primary mr-2">[UPDATER]</span>
      )}
      {level >= 3 && (
        <span className="text-orange-500 mr-2">[MVP]</span>
      )}
      {isOP && <span className="text-primary mr-2">[OP]</span>}
      <span
        className={`${effectClass}`}
        style={{
          imageRendering: 'pixelated',
          color: useCustomColor ? nameColor : undefined,
          fontFamily,
        }}
      >
        {name.length > 15 ? name.substring(0, 15) + "..." : name}
      </span>
    </span>
  );
}
