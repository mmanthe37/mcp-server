/**
 * Terminal Buffer — represents the terminal screen state.
 * Fixed-size grid of cells with attributes (colors, bold, etc.)
 */

export interface CellAttributes {
  fg: number;
  bg: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  inverse: boolean;
  dim: boolean;
}

export interface Cell {
  char: string;
  width: number;
  attrs: CellAttributes;
}

const DEFAULT_ATTRS: CellAttributes = {
  fg: 7, bg: 0,
  bold: false, italic: false, underline: false,
  strikethrough: false, inverse: false, dim: false,
};

export class TerminalBuffer {
  readonly cols: number;
  readonly rows: number;
  private cells: Cell[][];
  private _cursorCol = 0;
  private _cursorRow = 0;
  private scrollTop = 0;
  private scrollBottom: number;
  private _attrs: CellAttributes = { ...DEFAULT_ATTRS };
  private _dirty = true;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.scrollBottom = rows - 1;
    this.cells = this.createGrid();
  }

  get cursorCol(): number { return this._cursorCol; }
  get cursorRow(): number { return this._cursorRow; }
  get isDirty(): boolean { return this._dirty; }

  getCell(col: number, row: number): Cell | null {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return this.cells[row][col];
    }
    return null;
  }

  writeChar(char: string, width = 1): void {
    if (this._cursorCol >= this.cols) {
      this._cursorCol = 0;
      this.lineFeed();
    }
    if (this._cursorRow < this.rows && this._cursorCol < this.cols) {
      this.cells[this._cursorRow][this._cursorCol] = {
        char, width, attrs: { ...this._attrs },
      };
      this._cursorCol += width;
    }
    this._dirty = true;
  }

  moveCursor(col: number, row: number): void {
    this._cursorCol = Math.max(0, Math.min(col, this.cols - 1));
    this._cursorRow = Math.max(0, Math.min(row, this.rows - 1));
  }

  lineFeed(): void {
    if (this._cursorRow >= this.scrollBottom) {
      this.scrollUp(1);
    } else {
      this._cursorRow++;
    }
    this._dirty = true;
  }

  carriageReturn(): void {
    this._cursorCol = 0;
  }

  eraseInLine(mode: number): void {
    const row = this._cursorRow;
    switch (mode) {
      case 0: // cursor to end
        for (let c = this._cursorCol; c < this.cols; c++) {
          this.cells[row][c] = this.emptyCell();
        }
        break;
      case 1: // start to cursor
        for (let c = 0; c <= this._cursorCol; c++) {
          this.cells[row][c] = this.emptyCell();
        }
        break;
      case 2: // entire line
        for (let c = 0; c < this.cols; c++) {
          this.cells[row][c] = this.emptyCell();
        }
        break;
    }
    this._dirty = true;
  }

  eraseInDisplay(mode: number): void {
    switch (mode) {
      case 0: // cursor to end
        this.eraseInLine(0);
        for (let r = this._cursorRow + 1; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            this.cells[r][c] = this.emptyCell();
          }
        }
        break;
      case 1: // start to cursor
        this.eraseInLine(1);
        for (let r = 0; r < this._cursorRow; r++) {
          for (let c = 0; c < this.cols; c++) {
            this.cells[r][c] = this.emptyCell();
          }
        }
        break;
      case 2: // entire screen
      case 3:
        this.cells = this.createGrid();
        break;
    }
    this._dirty = true;
  }

  setAttributes(attrs: Partial<CellAttributes>): void {
    this._attrs = { ...this._attrs, ...attrs };
  }

  resetAttributes(): void {
    this._attrs = { ...DEFAULT_ATTRS };
  }

  resize(newCols: number, newRows: number): TerminalBuffer {
    const newBuffer = new TerminalBuffer(newCols, newRows);
    for (let r = 0; r < Math.min(this.rows, newRows); r++) {
      for (let c = 0; c < Math.min(this.cols, newCols); c++) {
        const cell = this.cells[r]?.[c];
        if (cell) {
          newBuffer.cells[r][c] = { ...cell, attrs: { ...cell.attrs } };
        }
      }
    }
    newBuffer.moveCursor(
      Math.min(this._cursorCol, newCols - 1),
      Math.min(this._cursorRow, newRows - 1)
    );
    return newBuffer;
  }

  markClean(): void {
    this._dirty = false;
  }

  private scrollUp(lines: number): void {
    for (let i = 0; i < lines; i++) {
      this.cells.splice(this.scrollTop, 1);
      const newRow = Array.from({ length: this.cols }, () => this.emptyCell());
      this.cells.splice(this.scrollBottom, 0, newRow);
    }
  }

  private createGrid(): Cell[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => this.emptyCell())
    );
  }

  private emptyCell(): Cell {
    return { char: ' ', width: 1, attrs: { ...DEFAULT_ATTRS } };
  }
}
