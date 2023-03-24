import { Attributes } from '../../node_modules/graphology-types'
/**
 * the node structure we need
 */
export interface NeedNode {
    key: string;
    attributes: {
        cluster: string;
        label: string;
        image: String | undefined;
        type: string;
        tag: string;
        size: number | undefined;
        score: number;
        x: number;
        y: number;
        color: String | undefined;
        clusterLabel: String | undefined;
    } | Attributes;
}

export interface State {
    //now hovering node
    hoveredNode?: string;

    hoveredEdges?: Array<NeedEdge>;

    // now dragging node
    draggedNode?: string;

    // State derived from hovered node:
    hoveredNeighbors?: Set<string>;
}

export interface NeedEdge {
    key: string;
    source: string;
    target: string;
    attributes: {
        type: string;
        size: number;
    };
}
export interface NeedData {
    edges: NeedEdge[];
    nodes: NeedNode[];
}