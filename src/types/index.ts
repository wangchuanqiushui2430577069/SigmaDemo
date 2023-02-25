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
  };
}

export interface State {
    //now hovering node
    hoveredNode?: string;

    // State derived from query:
    selectedNode?: string;

    // State derived from hovered node:
    hoveredNeighbors?: Set<string>;
}

export interface NeedData {
    edges: {
        key: string;
        source: string;
        target: string;
        attributes: {
            type: string;
            size: number;
        };
    }[];
    nodes: NeedNode[];
}