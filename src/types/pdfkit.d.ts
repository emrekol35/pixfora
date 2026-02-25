declare module "pdfkit" {
  import { Writable } from "stream";

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
    };
  }

  class PDFDocument extends Writable {
    constructor(options?: PDFDocumentOptions);

    x: number;
    y: number;
    page: { width: number; height: number };

    pipe(destination: Writable): Writable;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: Record<string, unknown>): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    strokeColor(color: string): this;
    fillColor(color: string): this;
    rect(x: number, y: number, w: number, h: number): this;
    fill(color?: string): this;
    save(): this;
    restore(): this;
    addPage(options?: PDFDocumentOptions): this;
    end(): void;

    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
  }

  export = PDFDocument;
}
