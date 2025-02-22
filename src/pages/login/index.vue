<template>
  <!-- Login 10 - Bootstrap Brain Component -->
  <section>
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5 col-xxl-4 content">
          <div class="mb-5">
            <div class="flex justify-center mb-4">
              <img src="../../assets/Techzenlogo.png" alt="Logo" width="175" height="150" />
            </div>
            <h2 class="text-center mb-4">Đăng nhập Tech Assess 360</h2>
          </div>
          <div class="card border border-light-subtle rounded-4">
            <div class="card-body p-3 p-md-4 p-xl-5">
              <form @submit.prevent="handleLogin">
                <div class="row gy-3 overflow-hidden">
                  <div class="col-12">
                    <div class="form-floating mb-3">
                      <input type="text" class="form-control" v-model="username" placeholder="anv (Nguyễn Văn A)" />
                      <label for="username" class="form-label">Tài khoản</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-floating mb-3">
                      <input
                        type="password"
                        class="form-control"
                        v-model="password"
                        id="password"
                        value=""
                        placeholder="Password"
                      />
                      <label for="password" class="form-label">Mật khẩu</label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="" name="remember_me" id="remember_me" />
                      <label class="form-check-label text-secondary" for="remember_me"> Ghi nhớ đăng nhập </label>
                    </div>
                  </div>
                  <div class="col-12">
                    <div class="d-grid">
                      <button class="btn btn-primary btn-lg" type="submit">Đăng nhập</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import AuthService from "@/services/AuthService";
import UserService from "@/services/UserService";
import ProjectService from "@/services/ProjectService";
export default {
  name: "LoginPage",
  data() {
    return {
      username: "",
      password: "",
      userInfo: null,
    };
  },
  methods: {
    async handleLogin() {
      if (!this.username || !this.password) {
        toast.error("Vui lòng nhập tài khoản và mật khẩu!");
        return;
      }
      const res = await AuthService.login(this.username, this.password); // Đợi Promise hoàn tất
      if (res.code === 1011) {
        const res = await AuthService.fetchUserByUserName(this.username);
        if (res.code === 1010) {
          const customUser = res.data;
          const res2 = await UserService.fetchUserById(customUser.id);
          if (res2.code === 1010) {
            this.userInfo = res2.data;
            const projectPromises = this.userInfo.userProjects.map(async (record) => {
              const res = await ProjectService.fetchProjectById(record.projectId);
              if (res.code === 1010) {
                // Thay vì push vào userProjects, nên thay thế hoặc thêm vào một danh sách riêng
                return res.data; // Trả về dữ liệu dự án
              }
            });

            // Chờ tất cả các dự án được fetch xong
            const projects = await Promise.all(projectPromises);
            // Lọc ra các dự án hợp lệ và thêm vào userProjects
            this.userInfo.userProjects = projects.filter((project) => project !== undefined);

            localStorage.setItem("user", JSON.stringify(this.userInfo));
          }
        }
        toast.success("Đăng nhận thành công!");
        this.$router.push("/");
      } else {
        toast.error("Tài khoản hoặc mật khẩu sai");
      }
    },
  },
};
</script>
<style scoped>
section {
  height: 100vh;
  background-color: #4e7fcf;
  padding-top: 150px;
}

.content {
  background-color: white;
  border-radius: 2%;
  padding: 20px;
}
</style>
