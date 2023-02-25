import { createApp } from 'vue'
// import './style.css'
import App from './App.vue'
import HelloWorld from './components/HelloWorld.vue'
import { provide, reactive } from 'vue'



const app = createApp(App)

app.component('HelloWorld', HelloWorld)

app.config.errorHandler = (err) => {
    /* 处理错误 */
    console.error(err.message)
}


app.mount('#app')

