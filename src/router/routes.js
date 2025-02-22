import { createRouter, createWebHistory } from "vue-router";
import { AssessResultPage, HomePage, LoginPage, PersonalAssessPage, ProfilePage, TeammatesAssessPage } from "@/pages";
import AuthService from "@/services/AuthService";
const routes = [
  { path: "/", component: HomePage },
  {
    path: "/personal-assess",
    name: "Personal",
    component: PersonalAssessPage,
    meta: { requiresAuth: true }, // Chỉ cho phép truy cập nếu đã đăng nhập
  },
  {
    path: "/teammates-assess",
    name: "TeamMates",
    component: TeammatesAssessPage,
    meta: { requiresAuth: true }, // Chỉ cho phép truy cập nếu không đăng nhập
  },
  {
    path: "/profile",
    name: "Profile",
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/assess-result",
    name: "AssessResult",
    component: AssessResultPage,
    meta: { requiresAuth: true },
  },
  { path: "/login", component: LoginPage, meta: { hideHeader: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
router.beforeEach((to, from, next) => {
  // Kiểm tra nếu route yêu cầu đăng nhập
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!AuthService.isLogin()) {
      // Nếu chưa đăng nhập, chuyển hướng đến trang login
      next({
        path: "/login",
        query: { redirect: to.fullPath }, // Lưu lại đường dẫn để quay lại sau khi đăng nhập
      });
    } else {
      next(); // Đã đăng nhập, cho phép truy cập
    }
  } else {
    next(); // Route không yêu cầu đăng nhập
  }
});

export default router;
