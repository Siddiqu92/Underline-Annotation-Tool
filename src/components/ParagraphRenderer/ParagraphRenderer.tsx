import React from 'react';
import { Underline } from '../../types';
import './ParagraphRenderer.css';

interface ParagraphRendererProps {
  text: string;
  underlines: Underline[];
  selectedUnderlineId: string | null;
  onUnderlineClick: (id: string) => void;
}

const ParagraphRenderer: React.FC<ParagraphRendererProps> = ({
  text,
  underlines,
  selectedUnderlineId,
  onUnderlineClick
}) => {
  // Sort underlines by start index to render them in order
  const sortedUnderlines = [...underlines].sort((a, b) => a.startIndex - b.startIndex);

  // Create an array of text segments with underlines
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedUnderlines.forEach((underline) => {
    // Add text before the underline
    if (underline.startIndex > lastIndex) {
      segments.push(
        <span key={`text-${lastIndex}-${underline.startIndex}`}>
          {text.slice(lastIndex, underline.startIndex)}
        </span>
      );
    }

    // Add the underlined text
    const isSelected = underline.id === selectedUnderlineId;
    const underlineClass = isSelected ? 'underline selected' : 'underline';
    
    segments.push(
      <span
        key={`underline-${underline.id}`}
        className={underlineClass}
        onClick={(e) => {
          e.stopPropagation();
          onUnderlineClick(underline.id);
        }}
      >
        {text.slice(underline.startIndex, underline.endIndex)}
      </span>
    );

    lastIndex = underline.endIndex;
  });

  // Add remaining text after the last underline
  if (lastIndex < text.length) {
    segments.push(
      <span key={`text-${lastIndex}-${text.length}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return (
    <div className="paragraph-container">
      <p className="paragraph-text">{segments}</p>
    </div>
  );
};

export default ParagraphRenderer;