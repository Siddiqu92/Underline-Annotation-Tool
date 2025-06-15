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

// Local storage key for saving underlines
const UNDERLINES_STORAGE_KEY = 'underlineAnnotations';

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
  // Load saved underlines from localStorage if they exist
  const loadSavedUnderlines = (): Underline[] => {
    try {
      const savedData = localStorage.getItem(UNDERLINES_STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('Failed to load saved underlines:', error);
    }
    return initialUnderlines;
  };

  const [textWithUnderlines, setTextWithUnderlines] = useState<TextWithUnderlines>({
    text: initialText,
    underlines: loadSavedUnderlines()
  });
  const [selectedUnderlineId, setSelectedUnderlineId] = useState<string | null>(null);
  const [sentenceBoundaries, setSentenceBoundaries] = useState<SentenceBoundary[]>([]);
  const [currentSelection, setCurrentSelection] = useState<{start: number, end: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{success: boolean, message: string} | null>(null);
  const paragraphRef = useRef<HTMLDivElement>(null);

  // Calculate sentence boundaries when text changes
  useEffect(() => {
    const boundaries = getSentenceBoundaries(textWithUnderlines.text);
    setSentenceBoundaries(boundaries);
  }, [textWithUnderlines.text]);

  // Save underlines to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(UNDERLINES_STORAGE_KEY, JSON.stringify(textWithUnderlines.underlines));
    } catch (error) {
      console.error('Failed to save underlines:', error);
    }
  }, [textWithUnderlines.underlines]);

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

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // If an onSubmit prop is provided, use that (for API calls)
      if (onSubmit) {
        await onSubmit(textWithUnderlines.underlines);
      }

      // For localStorage, we're already saving automatically in the useEffect
      setSubmitStatus({
        success: true,
        message: 'Underlines saved successfully! They will persist after refresh.'
      });
    } catch (error) {
      console.error('Submit failed:', error);
      setSubmitStatus({
        success: false,
        message: 'Failed to save underlines. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
      
      // Clear the status message after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 3000);
    }
  }, [onSubmit, textWithUnderlines.underlines]);

  // Clear all underlines
  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all underlines?')) {
      setTextWithUnderlines(prev => ({
        ...prev,
        underlines: []
      }));
      setSelectedUnderlineId(null);
    }
  }, []);

  const selectedUnderline = selectedUnderlineId 
    ? textWithUnderlines.underlines.find(ul => ul.id === selectedUnderlineId)
    : null;
  const selectedUnderlineText = selectedUnderline
    ? textWithUnderlines.text.slice(selectedUnderline.startIndex, selectedUnderline.endIndex)
    : '';

  const currentSelectionText = currentSelection
    ? textWithUnderlines.text.slice(currentSelection.start, currentSelection.end)
    : '';

  const debugUnderlines = textWithUnderlines.underlines.map(ul => ({
    id: ul.id,
    startIndex: ul.startIndex,
    endIndex: ul.endIndex,
    text: textWithUnderlines.text.slice(ul.startIndex, ul.endIndex),
    isSelected: ul.id === selectedUnderlineId
  }));

  return (
    <div className="underline-tool-container">
      <h2>Underline Annotation Tool</h2>
      
      {submitStatus && (
        <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
          {submitStatus.message}
        </div>
      )}
      
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
        <div className="selection-info">
          {currentSelection && `(Indices: ${currentSelection.start}-${currentSelection.end})`}
        </div>
        
        <h3>Selected Underline:</h3>
        <div className="selection-text">
          {selectedUnderlineText || 'No underline selected'}
        </div>
        <div className="selection-info">
          {selectedUnderline && `(ID: ${selectedUnderline.id}, Indices: ${selectedUnderline.startIndex}-${selectedUnderline.endIndex})`}
        </div>
      </div>

      <div className="tool-controls">
        <button
          onClick={handleAddUnderline}
          disabled={!currentSelection}
          className="major-button"
        >
          Add Underline
        </button>

        <button
          onClick={handleRemoveUnderline}
          disabled={!selectedUnderlineId}
          className="remove-button"
        >
          Remove Selected Underline
        </button>

        <button
          onClick={handleClearAll}
          disabled={textWithUnderlines.underlines.length === 0}
          className="clear-button"
        >
          Clear All Underlines
        </button>

        <button
          onClick={handleSubmit}
          disabled={textWithUnderlines.underlines.length === 0 || isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Saving...' : 'Save Underlines'}
        </button>
      </div>

      <div className="debug-info">
        <h3>Debug Information</h3>
        <div className="debug-section">
          <h4>Sentence Boundaries:</h4>
          <pre>
            {JSON.stringify(sentenceBoundaries, null, 2)}
          </pre>
        </div>
        <div className="debug-section">
          <h4>All Underlines ({textWithUnderlines.underlines.length}):</h4>
          <pre>
            {JSON.stringify(debugUnderlines, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default UnderlineTool;