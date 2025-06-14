export interface Underline {
  id: string;
  startIndex: number;
  endIndex: number;
}

export interface TextWithUnderlines {
  text: string;
  underlines: Underline[];
}

export interface SentenceBoundary {
  start: number;
  end: number;
}