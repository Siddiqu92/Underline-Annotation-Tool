import React from 'react';
import { Underline } from '../../types';
import './ParagraphRenderer.css';

interface ParagraphRendererProps {
  text: string;
  underlines: Underline[];
  selectedUnderlineId?: string | null;
  onUnderlineClick?: (id: string) => void;
}

const getUnderlineIdsForIndex = (underlines: Underline[], index: number) => {
  return underlines
    .filter(ul => index >= ul.startIndex && index < ul.endIndex)
    .sort((a, b) => (a.endIndex - a.startIndex) - (b.endIndex - b.startIndex)) // Sort by length (shortest first)
    .map(ul => ul.id);
};

const ParagraphRenderer: React.FC<ParagraphRendererProps> = ({
  text,
  underlines,
  selectedUnderlineId,
  onUnderlineClick,
}) => {
  // Build an array of underline ID sets for each character (sorted by length)
  const underlineMap: string[][] = [];
  for (let i = 0; i < text.length; i++) {
    underlineMap[i] = getUnderlineIdsForIndex(underlines, i);
  }

  // Group text by contiguous underline ID sets
  const segments: {
    start: number;
    end: number;
    underlineIds: string[];
  }[] = [];
  let segStart = 0;
  for (let i = 1; i <= text.length; i++) {
    const prev = underlineMap[i - 1] || [];
    const curr = underlineMap[i] || [];
    if (JSON.stringify(prev) !== JSON.stringify(curr) || i === text.length) {
      segments.push({
        start: segStart,
        end: i,
        underlineIds: prev,
      });
      segStart = i;
    }
  }

  return (
    <div className="paragraph-text">
      {segments.map((seg, idx) => {
        const segText = text.slice(seg.start, seg.end);
        if (seg.underlineIds.length === 0) {
          return <span key={idx}>{segText}</span>;
        }
        
        const isSelected = selectedUnderlineId && seg.underlineIds.includes(selectedUnderlineId);
        const underlineCount = seg.underlineIds.length;
        const selectedIndex = isSelected ? seg.underlineIds.indexOf(selectedUnderlineId!) : -1;

        return (
          <span
            key={idx}
            className={`underline-span underline-count-${underlineCount}${isSelected ? ' selected' : ''}`}
            data-selected-index={selectedIndex}
            onClick={e => {
              e.stopPropagation();
              if (onUnderlineClick && seg.underlineIds.length > 0) {
                // Select the smallest (most specific) underline at this position
                onUnderlineClick(seg.underlineIds[0]);
              }
            }}
            style={{
              '--underline-count': underlineCount,
              '--selected-index': selectedIndex,
            } as React.CSSProperties}
          >
            {segText}
            {/* Render multiple underline elements */}
            {Array.from({ length: underlineCount }).map((_, i) => (
              <span 
                key={i}
                className={`underline-line ${i === selectedIndex ? 'selected-line' : ''}`}
                style={{ bottom: `${i * 3}px` }}
              />
            ))}
          </span>
        );
      })}
    </div>
  );
};

export default ParagraphRenderer;