import type { TreeNodeData, ParsedLine } from "../types/tree";

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function parseLine(rawLine: string, lineIndex: number): ParsedLine | null {
  const trimmed = rawLine.trimEnd();
  if (!trimmed.trim()) return null;

  const leadingSpaces = trimmed.match(/^[ \t]*/)?.[0] || "";
  let level = 0;

  for (const char of leadingSpaces) {
    if (char === "\t") {
      level += 4;
    } else {
      level += 1;
    }
  }

  let text = trimmed.trimStart();

  const markdownUnordered = text.match(/^[-*+]\s+(.*)/);
  if (markdownUnordered) {
    text = markdownUnordered[1];
    level += 2;
  }

  const markdownOrdered = text.match(/^\d+\.\s+(.*)/);
  if (markdownOrdered) {
    text = markdownOrdered[1];
    level += 2;
  }

  return { text, level };
}

function normalizeLevels(lines: ParsedLine[]): ParsedLine[] {
  if (lines.length === 0) return [];

  const levels = [...new Set(lines.map((l) => l.level))].sort((a, b) => a - b);
  const levelMap = new Map<number, number>();

  levels.forEach((level, index) => {
    levelMap.set(level, index);
  });

  return lines.map((line) => ({
    ...line,
    level: levelMap.get(line.level) ?? 0,
  }));
}

export function parseIndentedText(text: string): {
  nodes: Map<string, TreeNodeData>;
  rootId: string | null;
} {
  const lines = text.split("\n");
  const parsedLines: ParsedLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLine(lines[i], i);
    if (parsed) {
      parsedLines.push(parsed);
    }
  }

  const normalized = normalizeLevels(parsedLines);

  const nodes = new Map<string, TreeNodeData>();
  const stack: { id: string; level: number }[] = [];
  let rootId: string | null = null;

  for (const line of normalized) {
    const id = generateId();
    const node: TreeNodeData = {
      id,
      label: line.text,
      level: line.level,
      parentId: null,
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= line.level) {
      stack.pop();
    }

    if (stack.length > 0) {
      const parentId = stack[stack.length - 1].id;
      node.parentId = parentId;
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children.push(id);
      }
    } else {
      rootId = id;
    }

    nodes.set(id, node);
    stack.push({ id, level: line.level });
  }

  return { nodes, rootId };
}
