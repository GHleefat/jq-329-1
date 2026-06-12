import { create } from "zustand";
import type { TreeState, TreeNodeData, NodePosition } from "../types/tree";
import { parseIndentedText } from "../utils/textParser";
import { calculateLayout } from "../utils/layout";

const DEFAULT_TEXT = `项目启动
  需求分析
    用户调研
    竞品分析
    需求文档
  设计阶段
    UI 设计
    技术方案
    原型评审
  开发阶段
    前端开发
    后端开发
    接口联调
  测试上线
    功能测试
    性能优化
    正式发布`;

const initialParsed = parseIndentedText(DEFAULT_TEXT);
const initialPositions = calculateLayout(
  initialParsed.nodes,
  initialParsed.rootId,
);

interface TreeStore extends TreeState {
  setText: (text: string) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  updateNodePosition: (nodeId: string, position: NodePosition) => void;
  resetLayout: () => void;
  setSelectedNode: (nodeId: string | null) => void;
  fitToView: (canvasWidth?: number, canvasHeight?: number) => void;
  setCanvasSize: (width: number, height: number) => void;
}

export const useTreeStore = create<TreeStore>((set, get) => ({
  nodes: initialParsed.nodes,
  positions: initialPositions,
  rootId: initialParsed.rootId,
  scale: 0.5,
  offset: { x: 50, y: 50 },
  text: DEFAULT_TEXT,
  selectedNodeId: null,
  canvasSize: { width: 800, height: 600 },

  setText: (text: string) => {
    const { nodes, rootId } = parseIndentedText(text);
    const positions = calculateLayout(nodes, rootId);
    set({ text, nodes, positions, rootId, selectedNodeId: null });
    setTimeout(() => {
      const { canvasSize } = get();
      get().fitToView(canvasSize.width, canvasSize.height);
    }, 0);
  },

  setScale: (scale: number) => {
    set({ scale: Math.max(0.1, Math.min(3, scale)) });
  },

  setOffset: (offset: { x: number; y: number }) => {
    set({ offset });
  },

  updateNodePosition: (nodeId: string, position: NodePosition) => {
    set((state) => {
      const newPositions = new Map(state.positions);
      newPositions.set(nodeId, position);
      return { positions: newPositions };
    });
  },

  resetLayout: () => {
    const { nodes, rootId, canvasSize } = get();
    const positions = calculateLayout(nodes, rootId);
    set({ positions, scale: 1, offset: { x: 0, y: 0 } });
    setTimeout(() => {
      get().fitToView(canvasSize.width, canvasSize.height);
    }, 0);
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  setCanvasSize: (width: number, height: number) => {
    set({ canvasSize: { width, height } });
  },

  fitToView: (canvasWidth?: number, canvasHeight?: number) => {
    const { positions, canvasSize } = get();
    if (positions.size === 0) return;

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

    const padding = 80;
    const treeWidth = maxX - minX + padding * 2;
    const treeHeight = maxY - minY + padding * 2;

    const cw = canvasWidth ?? canvasSize.width;
    const ch = canvasHeight ?? canvasSize.height;

    if (cw <= 0 || ch <= 0) return;

    const scaleX = cw / treeWidth;
    const scaleY = ch / treeHeight;
    const calculatedScale = Math.min(scaleX, scaleY, 1.2);
    const minScale = 0.3;
    const finalScale = Math.max(calculatedScale, minScale);

    const offsetX =
      -(minX - padding) * finalScale + (cw - treeWidth * finalScale) / 2;
    const offsetY =
      -(minY - padding) * finalScale + (ch - treeHeight * finalScale) / 2;

    set({
      scale: finalScale,
      offset: { x: offsetX, y: offsetY },
    });
  },
}));
