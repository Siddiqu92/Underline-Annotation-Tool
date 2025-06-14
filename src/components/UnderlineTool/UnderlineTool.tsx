import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Underline, TextWithUnderlines, SentenceBoundary } from '../../types';
import { 
  expandToWordBoundaries, 
  getSentenceBoundaries, 
  isWithinSingleSentence,
  getWordAtPosition
} from '../../utils/textUtils';
import ParagraphRenderer from '../ParagraphRenderer';
import './UnderlineTool.css';

interface UnderlineToolProps {
  initialText: string;
  initialUnderlines?: Underline[];
  onSubmit?: (underlines: Underline[]) => void;
}

const UnderlineTool: React.FC<UnderlineToolProps> = ({
  initialText,
  initialUnderlines = [],
  onSubmit
}) => {
  const [textWithUnderlines, setTextWithUnderlines] = useState<TextWithUnderlines>({
    text: initialText,
    underlines: initialUnderlines
  });
  const [selectedUnderlineId, setSelectedUnderlineId] = useState<string | null>(null);
  const [sentenceBoundaries, setSentenceBoundaries] = useState<SentenceBoundary[]>([]);
  const paragraphRef = useRef<HTMLDivElement>(null);

  // Calculate sentence boundaries when text changes
  useEffect(() => {
    const boundaries = getSentenceBoundaries(textWithUnderlines.text);
    setSentenceBoundaries(boundaries);
  }, [textWithUnderlines.text]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !paragraphRef.current) return;

    const range = selection.getRangeAt(0);
    const paragraphNode = paragraphRef.current.querySelector('.paragraph-text');
    if (!paragraphNode || !paragraphNode.contains(range.startContainer)) return;

    // Calculate character indices
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(paragraphNode);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preSelectionRange.toString().length;
    const endIndex = startIndex + selection.toString().length;

    // Skip empty or whitespace-only selections
    if (startIndex >= endIndex || !textWithUnderlines.text.slice(startIndex, endIndex).trim()) {
      selection.removeAllRanges();
      return;
    }

    // Expand to whole words
    const [wordStart, wordEnd] = expandToWordBoundaries(
      textWithUnderlines.text, 
      startIndex, 
      endIndex
    );

    // Validate the expanded selection
    if (wordStart >= wordEnd) {
      selection.removeAllRanges();
      return;
    }

    // Check sentence boundaries
    if (!isWithinSingleSentence(textWithUnderlines.text, wordStart, wordEnd, sentenceBoundaries)) {
      alert('Please select text within a single sentence.');
      selection.removeAllRanges();
      return;
    }

    // Check for existing identical underlines
    const isDuplicate = textWithUnderlines.underlines.some(
      ul => ul.startIndex === wordStart && ul.endIndex === wordEnd
    );

    if (!isDuplicate) {
      const newUnderline: Underline = {
        id: uuidv4(),
        startIndex: wordStart,
        endIndex: wordEnd
      };

      setTextWithUnderlines(prev => ({
        ...prev,
        underlines: [...prev.underlines, newUnderline]
      }));
    }

    selection.removeAllRanges();
  }, [textWithUnderlines.text, textWithUnderlines.underlines, sentenceBoundaries]);

  const handleUnderlineClick = useCallback((id: string) => {
    setSelectedUnderlineId(prev => prev === id ? null : id);
  }, []);

  const handleRemoveUnderline = useCallback(() => {
    if (!selectedUnderlineId) return;

    setTextWithUnderlines(prev => ({
      ...prev,
      underlines: prev.underlines.filter(underline => underline.id !== selectedUnderlineId)
    }));
    setSelectedUnderlineId(null);
  }, [selectedUnderlineId]);

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit(textWithUnderlines.underlines);
    }
  }, [onSubmit, textWithUnderlines.underlines]);

  // Enhanced debug information with actual text content
  const debugUnderlines = textWithUnderlines.underlines.map(ul => ({
    ...ul,
    text: textWithUnderlines.text.slice(ul.startIndex, ul.endIndex)
  }));

  return (
    <div className="underline-tool-container">
      <h2>Underline Annotation Tool</h2>
      
      <div 
        ref={paragraphRef}
        onMouseUp={handleTextSelection}
        onClick={() => setSelectedUnderlineId(null)}
      >
        <ParagraphRenderer
          text={textWithUnderlines.text}
          underlines={textWithUnderlines.underlines}
          selectedUnderlineId={selectedUnderlineId}
          onUnderlineClick={handleUnderlineClick}
        />
      </div>

      <div className="tool-controls">
        <button
          onClick={handleRemoveUnderline}
          disabled={!selectedUnderlineId}
          className="remove-button"
        >
          Remove Selected Underline
        </button>

        <button
          onClick={handleSubmit}
          disabled={textWithUnderlines.underlines.length === 0}
          className="submit-button"
        >
          Submit Underlines
        </button>
      </div>

      <div className="debug-info">
        <h3>Debug Information</h3>
        <p>Selected Underline ID: {selectedUnderlineId || 'None'}</p>
        <p>Underline Count: {textWithUnderlines.underlines.length}</p>
        <pre>
          {JSON.stringify(debugUnderlines, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default UnderlineTool;