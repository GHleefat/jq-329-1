import type { TreeNodeData, NodePosition } from "../types/tree";

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 180,
  nodeHeight: 56,
  horizontalGap: 60,
  verticalGap: 80,
};

function getSubtreeWidth(
  nodeId: string,
  nodes: Map<string, TreeNodeData>,
  config: LayoutConfig,
): number {
  const node = nodes.get(nodeId);
  if (!node || node.children.length === 0) {
    return config.nodeWidth;
  }

  let totalWidth = 0;
  for (let i = 0; i < node.children.length; i++) {
    totalWidth += getSubtreeWidth(node.children[i], nodes, config);
    if (i > 0) {
      totalWidth += config.horizontalGap;
    }
  }

  return Math.max(totalWidth, config.nodeWidth);
}

function layoutNode(
  nodeId: string,
  nodes: Map<string, TreeNodeData>,
  positions: Map<string, NodePosition>,
  x: number,
  y: number,
  config: LayoutConfig,
): number {
  const node = nodes.get(nodeId);
  if (!node) return x;

  if (node.children.length === 0) {
    positions.set(nodeId, {
      x,
      y,
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
    return x + config.nodeWidth;
  }

  const childWidths: number[] = [];
  let totalChildrenWidth = 0;

  for (let i = 0; i < node.children.length; i++) {
    const childWidth = getSubtreeWidth(node.children[i], nodes, config);
    childWidths.push(childWidth);
    totalChildrenWidth += childWidth;
    if (i > 0) {
      totalChildrenWidth += config.horizontalGap;
    }
  }

  const nodeLeftX = x + (totalChildrenWidth - config.nodeWidth) / 2;
  positions.set(nodeId, {
    x: nodeLeftX,
    y,
    width: config.nodeWidth,
    height: config.nodeHeight,
  });

  let currentX = x;
  const childY = y + config.nodeHeight + config.verticalGap;

  for (let i = 0; i < node.children.length; i++) {
    const endX = layoutNode(
      node.children[i],
      nodes,
      positions,
      currentX,
      childY,
      config,
    );
    currentX = endX + config.horizontalGap;
  }

  return x + totalChildrenWidth;
}

export function calculateLayout(
  nodes: Map<string, TreeNodeData>,
  rootId: string | null,
  options?: Partial<LayoutConfig>,
): Map<string, NodePosition> {
  const config = { ...DEFAULT_CONFIG, ...options };
  const positions = new Map<string, NodePosition>();

  if (!rootId) return positions;

  const totalWidth = getSubtreeWidth(rootId, nodes, config);
  const startX = 50;
  const startY = 50;

  layoutNode(rootId, nodes, positions, startX, startY, config);

  return positions;
}

export function getNodeCenter(position: NodePosition): {
  x: number;
  y: number;
} {
  return {
    x: position.x + position.width / 2,
    y: position.y + position.height / 2,
  };
}

export function getTreeBounds(positions: Map<string, NodePosition>): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
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
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
