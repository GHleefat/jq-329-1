import type { TreeNodeData, NodePosition } from "../types/tree";
import { getNodeCenter } from "./layout";

function generateSvgContent(
  nodes: Map<string, TreeNodeData>,
  positions: Map<string, NodePosition>,
  rootId: string | null,
  padding: number = 40,
): { svg: string; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  }

  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 400;
    maxY = 300;
  }

  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  const levelColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
  ];

  let linksSvg = "";
  const visitedLinks = new Set<string>();

  for (const node of nodes.values()) {
    if (node.parentId) {
      const linkKey = [node.parentId, node.id].sort().join("-");
      if (visitedLinks.has(linkKey)) continue;
      visitedLinks.add(linkKey);

      const parentPos = positions.get(node.parentId);
      const childPos = positions.get(node.id);
      if (parentPos && childPos) {
        const parentCenter = getNodeCenter(parentPos);
        const childCenter = getNodeCenter(childPos);

        const startX = parentCenter.x + offsetX;
        const startY = parentPos.y + parentPos.height + offsetY;
        const endX = childCenter.x + offsetX;
        const endY = childPos.y + offsetY;
        const midY = (startY + endY) / 2;

        linksSvg += `<path d="M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}" fill="none" stroke="#4b5563" stroke-width="2" stroke-linecap="round"/>`;
      }
    }
  }

  let nodesSvg = "";
  for (const [id, node] of nodes) {
    const pos = positions.get(id);
    if (!pos) continue;

    const x = pos.x + offsetX;
    const y = pos.y + offsetY;
    const colorIndex = node.level % levelColors.length;
    const bgColor = levelColors[colorIndex];

    nodesSvg += `
      <rect x="${x}" y="${y}" width="${pos.width}" height="${pos.height}" rx="12" ry="12" fill="${bgColor}" fill-opacity="0.9" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
      <text x="${x + pos.width / 2}" y="${y + pos.height / 2}" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500">${node.label}</text>
    `;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #1e1b4b;">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  ${linksSvg}
  ${nodesSvg}
</svg>`;

  return { svg, width, height };
}

export function exportSvg(
  nodes: Map<string, TreeNodeData>,
  positions: Map<string, NodePosition>,
  rootId: string | null,
): void {
  const { svg } = generateSvgContent(nodes, positions, rootId);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "tree-diagram.svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPng(
  nodes: Map<string, TreeNodeData>,
  positions: Map<string, NodePosition>,
  rootId: string | null,
  scale: number = 2,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const { svg, width, height } = generateSvgContent(nodes, positions, rootId);

    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to generate PNG"));
          return;
        }

        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = "tree-diagram.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };

    img.src = url;
  });
}
