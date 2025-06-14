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
  const [currentSelection, setCurrentSelection] = useState<{start: number, end: number} | null>(null);
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
      setCurrentSelection(null);
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
      setCurrentSelection(null);
      return;
    }

    // Check sentence boundaries
    if (!isWithinSingleSentence(textWithUnderlines.text, wordStart, wordEnd, sentenceBoundaries)) {
      alert('Please select text within a single sentence.');
      selection.removeAllRanges();
      setCurrentSelection(null);
      return;
    }

    setCurrentSelection({start: wordStart, end: wordEnd});
    selection.removeAllRanges();
  }, [textWithUnderlines.text, sentenceBoundaries]);

  const handleAddUnderline = useCallback(() => {
    if (!currentSelection) return;

    const {start, end} = currentSelection;

    // Check for existing identical underlines
    const isDuplicate = textWithUnderlines.underlines.some(
      ul => ul.startIndex === start && ul.endIndex === end
    );

    if (!isDuplicate) {
      const newUnderline: Underline = {
        id: uuidv4(),
        startIndex: start,
        endIndex: end
      };

      setTextWithUnderlines(prev => ({
        ...prev,
        underlines: [...prev.underlines, newUnderline]
      }));
    }

    setCurrentSelection(null);
  }, [currentSelection, textWithUnderlines.underlines]);

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

  // Get the selected underline text
  const selectedUnderlineText = selectedUnderlineId 
    ? textWithUnderlines.text.slice(
        textWithUnderlines.underlines.find(ul => ul.id === selectedUnderlineId)?.startIndex || 0,
        textWithUnderlines.underlines.find(ul => ul.id === selectedUnderlineId)?.endIndex || 0
      )
    : '';

  // Get the current selection text (before making it an underline)
  const currentSelectionText = currentSelection
    ? textWithUnderlines.text.slice(currentSelection.start, currentSelection.end)
    : '';

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

      <div className="selection-display">
        <h3>Current Selection:</h3>
        <div className="selection-text">
          {currentSelectionText || 'No text currently selected'}
        </div>
        
        <h3>Selected Underline:</h3>
        <div className="selection-text">
          {selectedUnderlineText || 'No underline selected'}
        </div>
      </div>

      <div className="tool-controls">
        <button
          onClick={handleAddUnderline}
          disabled={!currentSelection}
          className="major-button"
        >
          Major (Add Underline)
        </button>

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
      </div>
    </div>
  );
};

export default UnderlineTool;