import iconv from "iconv-lite";
import {
  formatReceiptItemRow,
  formatReceiptMetaPair,
  formatReceiptSubLine,
  receiptRuleLine,
} from "@/lib/utils/receiptRule";

const WIDTH = 42;

/** Encode Thai text for common 80mm ESC/POS printers (Windows-874 / TIS-620) */
export function encodeReceiptText(text: string): Uint8Array {
  return Uint8Array.from(iconv.encode(text, "cp874"));
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function escInit(): Uint8Array {
  return new Uint8Array([0x1b, 0x40]);
}

export function escAlign(mode: "left" | "center" | "right"): Uint8Array {
  const n = mode === "left" ? 0 : mode === "center" ? 1 : 2;
  return new Uint8Array([0x1b, 0x61, n]);
}

export function escBold(on: boolean): Uint8Array {
  return new Uint8Array([0x1b, 0x45, on ? 1 : 0]);
}

export function escFeed(lines = 1): Uint8Array {
  return new Uint8Array([0x1b, 0x64, Math.min(255, lines)]);
}

export function escCut(): Uint8Array {
  return new Uint8Array([0x1d, 0x56, 0x00]);
}

export function escTextLine(text: string): Uint8Array {
  return concat([encodeReceiptText(text), new Uint8Array([0x0a])]);
}

export function escRule(): Uint8Array {
  return escTextLine(receiptRuleLine());
}

export function escMetaPair(left: string, right: string): Uint8Array {
  return escTextLine(formatReceiptMetaPair(left, right));
}

export function escItemRow(item: string, qty: string, amount: string): Uint8Array {
  return escTextLine(formatReceiptItemRow(item, qty, amount));
}

export function escSubLine(text: string): Uint8Array {
  return escTextLine(formatReceiptSubLine(text));
}

/** Left label + right value on one line (truncate if too long) */
export function escRow(label: string, value: string, bold = false): Uint8Array {
  const gap = Math.max(1, WIDTH - label.length - value.length);
  const line = `${label}${" ".repeat(gap)}${value}`;
  return concat([escBold(bold), escTextLine(line.slice(0, WIDTH)), escBold(false)]);
}

export function escCenterLines(lines: string[], boldFirst = false): Uint8Array {
  const chunks: Uint8Array[] = [escAlign("center")];
  lines.forEach((line, i) => {
    if (boldFirst && i === 0) chunks.push(escBold(true));
    chunks.push(escTextLine(line));
    if (boldFirst && i === 0) chunks.push(escBold(false));
  });
  chunks.push(escAlign("left"));
  return concat(chunks);
}

export { concat as escConcat };
