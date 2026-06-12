export interface TreeNodeData {
  id: string;
  label: string;
  level: number;
  parentId: string | null;
  children: string[];
}

export interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TreeState {
  nodes: Map<string, TreeNodeData>;
  positions: Map<string, NodePosition>;
  rootId: string | null;
  scale: number;
  offset: { x: number; y: number };
  text: string;
  selectedNodeId: string | null;
  canvasSize: { width: number; height: number };
}

export interface ParsedLine {
  text: string;
  level: number;
}
