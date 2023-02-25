import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import HelloWorld from './components/HelloWorld.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'



const app = createApp(App)
app.use(ElementPlus)
app.component('HelloWorld', HelloWorld)

app.config.errorHandler = (err: any) => {
    /* 处理错误 */
    console.error(err.message)
}


app.mount('#app')

