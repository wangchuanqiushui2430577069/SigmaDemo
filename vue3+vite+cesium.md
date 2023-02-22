# Vue 3 + TypeScript + Vite + Cesium
# 前提是全局下载好了vite

# 1. 创建项目 [npm init vite]
###  1.1 选择 vue3
###  1.2 选择 TypeScript

# 2. 安装cesium（使用 [yarn add cesium] 或者 [npm install cesium]，[yarn add @types/cesium -D]带提示）
###  2.1 安装插件 
```node
yarn add -D vite vite-plugin-cesium
```

# 3.配置[vite.config.ts]
```js
     import { defineConfig } from 'vite';
     import cesium from 'vite-plugin-cesium'; // 引入插件
     export default defineConfig({
         plugins: [cesium()],
     });
```

# 4.引入 Cesium
```js 
import * as Cesium from "cesium";
import { onMounted } from "vue";
<script setup>
    onMounted(() => {
        // Cesium初始化代码
    })
</script>
```