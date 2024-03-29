<template>
  <div id="show">
    <el-container>
      <el-header>
        <el-select-v2 v-model="tagsValue" @change="changeTagsOptions" :options="tagsOptions" placeholder="Please select"
          style="width: 240px;height: 50px; margin: 10px;" multiple clearable collapse-tags collapse-tags-tooltip />
        <el-select-v2 v-model="clusterValue" @change="changeClusterOptions" :options="clusterOptions"
          placeholder="Please select" style="width: 240px;height: 50px; margin: 10px;" multiple clearable collapse-tags
          collapse-tags-tooltip />
      </el-header>
      <el-main>
        <div id="card" @dblclick="table = true"></div>

        <el-drawer v-model="table" title="I have a nested table inside!" direction="ltr" size="50%">
        </el-drawer>
      </el-main>
    </el-container>
  </div>
</template>
<script lang="ts">
import { NeedNode, State, NeedData, NeedEdge } from '../types/index'
import { defineComponent, onMounted, ref } from 'vue';
import { toRaw } from '@vue/reactivity'
import Graph from 'graphology';
import Sigma from 'sigma';

// import FA2Layout from "graphology-layout-forceatlas2/worker";
// import forceAtlas2 from "graphology-layout-forceatlas2";
import circlepack from 'graphology-layout/circlepack';
import getNodeProgramImage from "sigma/rendering/webgl/programs/node.image";
import { EdgeDisplayData, NodeDisplayData } from 'sigma/types';

import data from '../dataset.json';
import { Attributes } from 'graphology-types';

export default defineComponent({
  name: 'HelloWorld',
  setup() {
    // 转换官方原始数据
    let transformData = () => {
      // HACK:转换官方dataset.json数据，为finalData.json数据 (Change official data to finalData.json)
      // tag=>对应图片（'tag' Mapping to the image's url）
      let tagImageMap: Map<String, String> = new Map<String, String>()
      data.tags.forEach(tag => tagImageMap.set(tag.key, tag.image))

      // cluster=>对应颜色（'cluster' Mapping to the corresponding color）
      let clusterColorMap: Map<String, String> = new Map<String, String>()
      data.clusters.forEach(cluster => clusterColorMap.set(cluster.key, cluster.color))
      // cluster=>对应集群名（'cluster' Mapping to the cluster name）
      let clusterNameMap: Map<String, String> = new Map<String, String>()
      data.clusters.forEach(cluster => clusterNameMap.set(cluster.key, cluster.clusterLabel))
      // 计算node大小(Calculate the node size by its Relational number)
      let sizeMap: Map<String, number> = new Map<String, number>()

      // 构建节点(Build node)
      data.nodes.forEach(node => {
        // build sizeMap
        sizeMap.set(node.key, 1)
      })
      // 构建边(Build edge)
      let edgeIndex = 0
      let edges = data.edges.map(edge => {
        // coculate size
        let size_0 = sizeMap.get(edge[0])
        sizeMap.set(edge[0], size_0 == undefined ? 1 : size_0 + 0.35)
        let size_1 = sizeMap.get(edge[1])
        sizeMap.set(edge[1], size_1 == undefined ? 1 : size_1 + 0.35)
        return { 'key': '' + (++edgeIndex), 'source': edge[0], 'target': edge[1], 'attributes': { 'type': 'arrow', 'size': 1 } }
      })
      // 转换原有节点结构（Transform the original node structure）
      let nodes: NeedNode[] = data.nodes.map(node => {
        let nodeTemp = {
          'key': node.key,
          'attributes': {
            'cluster': node.cluster, 'label': node.label, 'image': tagImageMap.get(node.tag), 'type': 'image', 'tag': node.tag, 'size': sizeMap.get(node.key),
            'score': node.score, 'x': node.x, 'y': node.y, color: clusterColorMap.get(node.cluster), 'clusterLabel': clusterNameMap.get(node.cluster)
          }
        }
        return nodeTemp
      })
      // 图所需结构(Required structure)
      let needData: NeedData = { edges: edges, nodes: nodes }
      console.log('data', data)
      console.log('needData', needData)
      // init tagsOptions
      const tempTagsOptions: any[] = []
      for (let name of tagImageMap.keys()) {
        let temp = { value: name, label: name }
        tempTagsOptions.push(temp)
      }
      // init clusterOptions
      const tempClusterOptions: any[] = []
      for (let name of clusterNameMap.values()) {
        let temp = { value: name, label: name }
        tempClusterOptions.push(temp)
      }
      return { data: needData, cluster: tempClusterOptions, tags: tempTagsOptions };
    }

    // 初始化拓扑图
    let init = (needData: NeedData) => {
      const container = document.getElementById("card") as HTMLElement
      // 初始化简单图(init graph)
      const graph = new Graph()
      graph.import(needData)
      circlepack.assign(graph, {
        hierarchyAttributes: ['cluster', 'tag'],
        scale: 1.0
      })
      // 布局(init layout)
      // const sensibleSettings = forceAtlas2.inferSettings(graph);
      // const fa2Layout = new FA2Layout(graph, {
      //   settings: sensibleSettings,
      // })
      // fa2Layout.start()

      //创建sigma (new a sigma class)
      const renderer = new Sigma(graph, container, {
        // We don't have to declare edgeProgramClasses here, because we only use the default ones ("line" and "arrow")
        nodeProgramClasses: {
          image: getNodeProgramImage()
        },
        renderEdgeLabels: false, // 不显示边的label
      })
      // 相机
      renderer.getCamera().setState({
        angle: 0.5,
      })

      // 拖拽
      drag(renderer, graph)
      // 悬停
      hover(renderer, graph)
      // 双击节点
      doubleClickNode(renderer, graph)
      // 监听
      listener(renderer, graph)
    }

    // 双击按钮事件
    let doubleClickNode = (renderer: Sigma, graph: Graph<Attributes, Attributes, Attributes>) => {
      renderer.on("doubleClickNode", (e) => {

        let neighbor_nodes: Array<NeedNode> = []
        let edges: Array<NeedEdge> = []

        graph.forEachNeighbor(e.node, (neighbor, attributes) => {
          neighbor_nodes.push({ key: neighbor, attributes: { ...attributes } })
          graph.forEachEdge(e.node, neighbor, (edgeKey, edgeAttr, source, target, sourceAttr, targetAttr) => {
            const edge: NeedEdge =
            {
              key: edgeKey,
              source: source,
              target: target,
              attributes: { type: edgeAttr.type, size: edgeAttr.size }
            }
            edges.push(edge)
          })
        })
        let double_click_node: NeedNode = {
          key: e.node,
          attributes: toRaw(graph.getNodeAttributes(e.node))
        }
        state.hoveredEdges = edges.sort((e1, e2) => parseInt(e1.key) - parseInt(e2.key))
        console.log("double_click_node", double_click_node)
        console.log("neighbor_nodes", neighbor_nodes)
        console.log('hoveredEdges', state.hoveredEdges)
      })
    }

    // 拖拽方法
    let drag = (renderer: Sigma, graph: Graph<Attributes, Attributes, Attributes>) => {
      renderer.on("downNode", (e) => {
        state.draggedNode = e.node
      });

      // 拖拽逻辑On mouse move, if the drag mode is enabled, we change the position of the draggedNode
      renderer.getMouseCaptor().on("mousemovebody", (e) => {
        if (!state.draggedNode) return;

        // Get new position of node
        const pos = renderer.viewportToGraph(e);

        graph.setNodeAttribute(state.draggedNode, "x", pos.x);
        graph.setNodeAttribute(state.draggedNode, "y", pos.y);

        // Prevent sigma to move camera:
        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
      });

      // On mouse up, we reset the autoscale and the dragging mode
      renderer.getMouseCaptor().on("mouseup", () => {
        if (state.draggedNode) {
          graph.removeNodeAttribute(state.draggedNode, "highlighted");
          state.draggedNode = undefined;
        }
      });

      // Disable the autoscale at the first down interaction
      renderer.getMouseCaptor().on("mousedown", () => {
        if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
      });
    }

    // 悬停方法
    let hover = (renderer: Sigma, graph: Graph<Attributes, Attributes, Attributes>) => {
      // HACK:  实现悬停节点显示领域(Realize the display field of hovering nodes)
      let setHoveredNode = (node?: string) => {
        if (node) {
          state.hoveredNode = node
          state.hoveredNeighbors = new Set(graph.neighbors(node))
        } else {
          state.hoveredNode = undefined
          state.hoveredNeighbors = undefined
        }
        // Refresh rendering:
        renderer.refresh()
      }
      // Bind graph interactions:
      renderer.on("enterNode", ({ node }) => {
        setHoveredNode(node)
      });
      renderer.on("leaveNode", () => {
        setHoveredNode(undefined)
      });
    }

    // 监听nodes和edges
    let listener = (renderer: Sigma, graph: Graph<Attributes, Attributes, Attributes>) => {
      // 根据内部状态渲染节点：Render nodes accordingly to the internal state:
      renderer.setSetting("nodeReducer", (node, data) => {
        const res: Partial<NodeDisplayData> = { ...data }
        const attributes = graph.getNodeAttributes(node)
        // 根据选中的标签和集群筛选（Filter by selected tags and clusters）
        if (!(tagsValue.value.includes(attributes.tag) && clusterValue.value.includes(attributes.clusterLabel))) {
          res.hidden = true;
        }
        if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
          //res.hidden = true
          res.label = ""
          res.color = "#f6f6f6"
          return res
        }
        // 悬停(hovering time)
        if (state.hoveredNode === node) {
          res.highlighted = true
        }
        return res
      });

      // 根据内部状态渲染边缘： Render edges accordingly to the internal state:
      renderer.setSetting("edgeReducer", (edge, data) => {
        const res: Partial<EdgeDisplayData> = { ...data }
        // 隐藏其他关系线(hide other lines and nodes)
        if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
          res.hidden = true
          return res
        }
        if (state.hoveredNode && graph.hasExtremity(edge, state.hoveredNode)) {
          const attributes = graph.getNodeAttributes(state.hoveredNode)
          res.color = attributes.color?.toString()
          res.size = 1
        }
        return res
      })
    }

    // 改变标签多选列表值
    let changeTagsOptions = (tags: string[]) => {
      console.log('tags', tags);
    }
    // 改变聚类多选列表值
    let changeClusterOptions = (cluster: string[]) => {
      console.log('cluster', cluster);
    }

    // 得到所需数据（get data that you need）
    let result = transformData()
    // 节点状态
    let state: State = {}
    // 拓扑图渲染数据（Topology map rendering data）
    const finalData = ref(result.data)
    // 表单数据（form data）
    const tagsOptions = ref(result.tags)
    const clusterOptions = ref(result.cluster)
    // 默认全选（Select all by default）
    const tagsValue = ref(result.tags.map(tag => tag.value))
    const clusterValue = ref(result.cluster.map(cluster => cluster.value))

    // 抽屉显隐值 (Drawer concealment)
    const table = ref(false)

    onMounted(() => {
      init(finalData.value)
    })

    return {
      tagsValue,
      tagsOptions,
      clusterValue,
      clusterOptions,
      table,

      changeTagsOptions,
      changeClusterOptions,

      init,
    }
  }
});

</script>


<style scoped>
.read-the-docs {
  color: #888;
}

.el-main {
  margin: 0em;
  padding: 0em;
}

#card {
  width: 96vw;
  height: 90vh;
  margin: 0px;
  padding: 0px;
}
</style>
