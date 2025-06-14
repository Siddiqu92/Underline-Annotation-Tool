import { SentenceBoundary } from '../types';

// Improved word boundary detection that handles punctuation and edge cases
export const expandToWordBoundaries = (text: string, start: number, end: number): [number, number] => {
  if (start >= end) return [start, end]; // Invalid selection
  
  // First trim any whitespace from the selection
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  
  if (start >= end) return [start, end]; // Empty after trimming

  // Special case: if selection is just whitespace or punctuation
  if (/^[\s.,!?;:]+$/.test(text.slice(start, end))) {
    return [start, end];
  }

  // Expand left to find word start (including apostrophes and hyphens)
  let newStart = start;
  while (newStart > 0 && /[^\s.,!?;:]/.test(text[newStart - 1])) {
    newStart--;
  }

  // Expand right to find word end (including apostrophes and hyphens)
  let newEnd = end;
  while (newEnd < text.length && /[^\s.,!?;:]/.test(text[newEnd])) {
    newEnd++;
  }

  return [newStart, newEnd];
};

// More accurate sentence boundary detection
export const getSentenceBoundaries = (text: string): SentenceBoundary[] => {
  // Improved regex that handles abbreviations, quotes, and other edge cases
  const sentenceRegex = /[^.!?\s][^.!?]*(?:[.!?](?!['"]?\s|$)[^.!?]*)*[.!?]?['"]?(?=\s|$)/g;
  const boundaries: SentenceBoundary[] = [];
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    boundaries.push({
      start: match.index,
      end: match.index + match[0].length
    });
  }

  if (boundaries.length === 0 && text.length > 0) {
    boundaries.push({ start: 0, end: text.length });
  }

  return boundaries;
};

// Check if selection is within a single sentence with boundary caching
export const isWithinSingleSentence = (
  text: string,
  start: number,
  end: number,
  sentenceBoundaries?: SentenceBoundary[]
): boolean => {
  const boundaries = sentenceBoundaries || getSentenceBoundaries(text);
  
  // First check if selection is entirely within one sentence
  for (const boundary of boundaries) {
    if (start >= boundary.start && end <= boundary.end) {
      return true;
    }
  }
  
  // If not, check if it's a multi-sentence selection
  return false;
};

// Clip selection to the sentence containing the start position
export const clipToSentenceBoundary = (
  text: string,
  start: number,
  end: number,
  sentenceBoundaries?: SentenceBoundary[]
): [number, number] => {
  const boundaries = sentenceBoundaries || getSentenceBoundaries(text);
  
  for (const boundary of boundaries) {
    if (start >= boundary.start && start < boundary.end) {
      return [
        Math.max(start, boundary.start),
        Math.min(end, boundary.end)
      ];
    }
  }
  
  return [start, end];
};

// Helper function to get word at position (for debugging)
export const getWordAtPosition = (text: string, pos: number): string => {
  if (pos < 0 || pos >= text.length) return '';
  
  let start = pos;
  let end = pos;
  
  while (start > 0 && !/\s/.test(text[start - 1])) start--;
  while (end < text.length && !/\s/.test(text[end])) end++;
  
  return text.slice(start, end);
};