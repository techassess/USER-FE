import { createApp } from "vue";
import App from "@/App.vue";

// import css
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "@/styles/style.css";
import "@/styles/index.css";
// router
import router from "@/router/routes";
const app = createApp(App);

app.use(router);
app.mount("#app");
