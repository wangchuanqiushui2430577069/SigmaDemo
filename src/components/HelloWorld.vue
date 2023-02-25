<template>
  <div id="card" >
  </div>
</template>
<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import Graph from 'graphology';
import Sigma from 'sigma';

import FA2Layout from "graphology-layout-forceatlas2/worker";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circlepack from 'graphology-layout/circlepack';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import { EdgeDisplayData, NodeDisplayData } from 'sigma/types';

import data from '../../public/dataset.json';

export default defineComponent({
  name: 'HelloWorld',
  setup() {
    onMounted(() => {
      init()
    })

    /**
     * the node structure we need
     */
    interface NeedNode {
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
      }
    };
    let init = () => {
      const container = document.getElementById("card") as HTMLElement;
      // HACK:转换官方dataset.json数据，为finalData.json数据 (Change official data to finalData.json)
      // tag=>对应图片（'tag' Mapping to the image's url）
      let tagImageMap: Map<String, String> = new Map<String, String>();
      data.tags.forEach(tag => tagImageMap.set(tag.key, tag.image))

      // cluster=>对应颜色（'cluster' Mapping to the corresponding color）
      let clusterColorMap: Map<String, String> = new Map<String, String>();
      data.clusters.forEach(cluster => clusterColorMap.set(cluster.key, cluster.color))
      // cluster=>对应集群名（'cluster' Mapping to the cluster name）
      let clusterNameMap: Map<String, String> = new Map<String, String>();
      data.clusters.forEach(cluster => clusterNameMap.set(cluster.key, cluster.clusterLabel))
      // 计算node大小(Calculate the node size by its Relational number)
      let sizeMap: Map<String, number> = new Map<String, number>();

      // 构建节点(Build node)
      data.nodes.forEach(node => {
        // build sizeMap
        sizeMap.set(node.key, 1);
      })
      // 构建边(Build edge)
      let edgeIndex = 1
      let edges = data.edges.map(edge => {
        // coculate size
        let size_0 = sizeMap.get(edge[0])
        sizeMap.set(edge[0], size_0 == undefined ? 1 : size_0 + 0.5)
        let size_1 = sizeMap.get(edge[1])
        sizeMap.set(edge[1], size_1 == undefined ? 1 : size_1 + 0.5)
        return { 'key': '' + (++edgeIndex), 'source': edge[0], 'target': edge[1], 'attributes': { 'type': 'arrow', 'size': 1 } }
      })
      // 转换原有节点结构（Transform the original node structure）
      let nodes = data.nodes.map(node => {
        let nodeTemp = {
          'key': node.key,
          'attributes': {
            'cluster': node.cluster, 'label': node.label, 'image': tagImageMap.get(node.tag), 'type': 'image', 'tag': node.tag, 'size': sizeMap.get(node.key),
            'score': node.score, 'x': node.x, 'y': node.y, color: clusterColorMap.get(node.cluster), 'clusterLabel': clusterNameMap.get(node.cluster)
          }
        }
        return nodeTemp;
      })
      // 图所需结构(Required structure)
      let needData = { edges: edges, nodes: nodes }
      console.log('data', data);
      console.log('needData', needData)
      // 初始化简单图(init graph)
      const graph = new Graph();
      circlepack.assign(graph, {
        hierarchyAttributes: ['cluster'],
      });
      // 布局(init layout)
      const sensibleSettings = forceAtlas2.inferSettings(graph);
      const fa2Layout = new FA2Layout(graph, {
        settings: sensibleSettings,
      });
      fa2Layout.start();
      graph.import(needData);

      //创建sigma (new a sigma class)
      const renderer = new Sigma(graph, container, {
        // We don't have to declare edgeProgramClasses here, because we only use the default ones ("line" and "arrow")
        nodeProgramClasses: {
          image: getNodeProgramImage()
        },
        renderEdgeLabels: false, // 不显示边的label
      });
      renderer.getCamera().setState({
        angle: 1,
      });
      // HACK:  实现悬停节点显示领域(Realize the display field of hovering nodes)

      interface State {
        //now hovering node
        hoveredNode?: string;

        // State derived from query:
        selectedNode?: string;

        // State derived from hovered node:
        hoveredNeighbors?: Set<string>;
      }
      let state: State = {};
      let setHoveredNode = (node?: string) => {
        if (node) {
          state.hoveredNode = node;
          state.hoveredNeighbors = new Set(graph.neighbors(node));
        } else {
          state.hoveredNode = undefined;
          state.hoveredNeighbors = undefined;
        }
        // Refresh rendering:
        renderer.refresh();
      }
      // Bind graph interactions:
      renderer.on("enterNode", ({ node }) => {
        setHoveredNode(node);
      });
      renderer.on("leaveNode", () => {
        setHoveredNode(undefined);
      });

      renderer.setSetting("nodeReducer", (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data };

        if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
          res.label = "";
          res.color = "#f6f6f6";
          return res;
        }
        // 悬停(hovering time)
        if (state.hoveredNode === node) {
          res.highlighted = true;
          return res;
        }
        return res;
      });

      // Render edges accordingly to the internal state:
      renderer.setSetting("edgeReducer", (edge, data) => {
        const res: Partial<EdgeDisplayData> = { ...data };
        // 隐藏其他关系线(hide other lines and nodes)
        if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
          res.hidden = true;
          return res;
        }
        if (state.hoveredNode && graph.hasExtremity(edge, state.hoveredNode)) {
          const attributes = graph.getNodeAttributes(state.hoveredNode)
          res.color = attributes.color?.toString();
          res.size = 3
        }
        return res;
      });

    }

    return {
      init
    }
  }
});

</script>


<style scoped>
.read-the-docs {
  color: #888;
}

#card {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
