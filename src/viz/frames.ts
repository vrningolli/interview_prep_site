/* Frame model for the step-through visualizer.
   A visualization is a list of frames; each frame is a full snapshot:
   rows of cells (with states + labels), watched variables, a narration
   caption, and the code line being executed. The player just renders
   frame[i] — so stepping backward is free. */

export type CellState = "default" | "active" | "done" | "dim" | "warn";

export interface Cell {
  v: string | number;
  s?: CellState;
  l?: string; // small label under the cell, e.g. "[0]", "L", "head"
}

export interface Row {
  title?: string;
  cells: Cell[];
  kind?: "row" | "stack" | "chain"; // chain draws arrows between cells; stack renders bottom-up
}

export interface Predict {
  q: string;
  opts: string[];
  correct: number;
}

export interface Frame {
  caption: string;
  rows: Row[];
  vars?: Record<string, string | number>;
  line?: number; // index into Viz.code to highlight
  note?: string; // callout shown under the caption (e.g. final result)
  predict?: Predict; // in Quiz-me mode, asked BEFORE this frame is revealed
}

export interface Viz {
  title: string;
  intro: string;
  code: string[];
  frames: Frame[];
}

/* Shorthand builders used by the generators. */
export const c = (v: string | number, s?: CellState, l?: string): Cell => ({ v, s, l });
export const row = (cells: Cell[], title?: string, kind: Row["kind"] = "row"): Row => ({ title, cells, kind });
