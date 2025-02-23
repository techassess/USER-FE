<template>
  <div class="site-mobile-menu">
    <div class="site-mobile-menu-header">
      <div class="site-mobile-menu-close mt-3">
        <span class="icon-close2 js-menu-toggle"></span>
      </div>
    </div>
    <div class="site-mobile-menu-body"></div>
  </div>

  <header class="site-navbar">
    <div class="container-fluid">
      <div class="row align-items-center">
        <div class="col-6 d-flex align-items-center flex-wrap justify-content-between left-navbar">
          <h1 class="mb-0 site-logo">
            <img src="../assets/Techzenlogo.png" alt="logo" />
          </h1>
          <div class="d-flex align-items-center">
            <span class="ml-3 text-black font-weight-bold">Còn</span>
            <div class="countdown-timer" id="countdown">
              <span v-if="loading">Loading...</span>
              <span v-else>{{ countdown }}</span>
            </div>
            <span class="text-black font-weight-bold">để đánh giá</span>
          </div>
        </div>
        <div class="col-6 d-none d-xl-block right-navbar">
          <nav class="site-navigation position-relative text-right" role="navigation">
            <ul class="site-menu js-clone-nav d-flex gap-2 justify-content-end mr-auto">
              <li v-for="(item, index) in filteredMenuItems" :key="index" :class="{ active: activeIndex === index }">
                <RouterLink :to="item.link"
                  ><span>{{ item.text }}</span></RouterLink
                >
              </li>
              <li v-if="userInfo">
                <div class="user-info d-flex align-items-center">
                  <img
                    :src="userInfo.fileInfo ? userInfo.fileInfo.fileUrl : profileImage"
                    alt="Avatar"
                    class="avatar"
                  />
                  <span class="ml-2 text-center" data-bs-toggle="dropdown">
                    {{ userInfo.rank.position.name }}
                    <br />
                    {{ userInfo.name }}
                    <i class="ms-2 bi bi-caret-down-square-fill dropdown"></i>
                  </span>
                  <ul class="dropdown-menu">
                    <li>
                      <a :href="'/profile'" class="dropdown-item"> <i class="bi bi-person me-3"></i> Cá nhân </a>
                    </li>
                    <li @click.prevent="handleLogout">
                      <a class="dropdown-item" href="#"> <i class="bi bi-box-arrow-right me-3"></i> Đăng xuất </a>
                    </li>
                  </ul>
                </div>
              </li>
              <li v-else>
                <router-link to="/login" class="user-info d-flex align-items-center">
                  <button type="button" class="btn btn-primary ml-2">Đăng nhập</button>
                </router-link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <div class="d-xl-none ml-md-0 mr-auto py-3">
        <a href="#" class="site-menu-toggle js-menu-toggle text-white"><span class="icon-menu h3"></span></a>
      </div>
    </div>
  </header>
</template>

<script>
import { RouterLink } from "vue-router";
import { toast } from "vue3-toastify";

export default {
  name: "HeaderComponent",
  components: {
    RouterLink,
  },
  data() {
    return {
      countdown: "",
      countDownDate: new Date().getTime() + 5 * 24 * 60 * 60 * 1000, //đặt thời gian đếm ngược 5 ngày
      loading: true,
      activeIndex: 0,
      userInfo: null,
      menuItems: [
        { text: "Trang chủ", link: "/" },
        { text: "Đánh giá cá nhân", link: "/personal-assess" },
        { text: "Đánh giá chéo", link: "/teammates-assess" },
        // { text: "Kết quả đánh giá", link: "/assess-result" },
        // { text: "Kết quả đánh giá", link: "/assess-result" },
      ],
      profileImage:
        "https://png.pngtree.com/png-clipart/20231216/original/pngtree-vector-office-worker-staff-avatar-employee-icon-png-image_13863941.png",
    };
  },
  computed: {
    filteredMenuItems() {
      const items = [...this.menuItems];
      return items;
    },
  },
  mounted() {
    this.checkUserLoggedIn();
    this.startCountdown();
    this.checkActivePath();
    window.addEventListener("resize", this.handleResize);
    this.$router.beforeEach((to, from, next) => {
      this.checkActivePath(to.path);
      next();
    });

  },
  methods: {
    checkUserLoggedIn() {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        this.userInfo = JSON.parse(localStorage.getItem("user"));
        console.log(this.userInfo);
        let haveTeammates = false;
        this.userInfo.userProjects.forEach((project) => {
          if (project.userProjects.length > 1) haveTeammates = true;
        });
        if (!haveTeammates) {
          this.menuItems = this.menuItems.filter((item) => item.link !== "/teammates-assess");
        }
      }
    },
    handleLogout() {
      console.log("handleLogout was called");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("assessDetails");
      localStorage.removeItem("listData");
      localStorage.removeItem("userDepartmentId");
      localStorage.removeItem("assess-by-user" + this.userInfo.id);
      this.userInfo = null;
      toast.success("Đăng xuất thành công", {
        autoClose: 2000,
      });
      this.$router.push("/login").then(() => {
        // Reload để đảm bảo header cập nhật lại
        window.location.reload();
      });
    },
    checkActivePath(path = window.location.pathname) {
      const items = this.filteredMenuItems;
      items.forEach((item, index) => {
        if (item.link === path) {
          this.activeIndex = index;
        }
      });
    },
    startCountdown() {
      // Kiểm tra nếu đã có giá trị lưu trong localStorage
      const storedCountDownDate = localStorage.getItem("countDownDate");

      // Nếu chưa có, lưu thời gian kết thúc hiện tại vào localStorage
      if (!storedCountDownDate) {
        localStorage.setItem("countDownDate", this.countDownDate);
      } else {
        this.countDownDate = parseInt(storedCountDownDate); // Gán giá trị từ localStorage
      }

      const x = setInterval(() => {
        const now = new Date().getTime();
        const distance = this.countDownDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        this.countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        if (distance < 0) {
          clearInterval(x);
          this.countdown = "EXPIRED";
          localStorage.removeItem("countDownDate"); // Xóa khi hết hạn
        }

        // Tắt màn hình loading sau khi bộ đếm bắt đầu
        this.loading = false;
      }, 1000);
    },
    handleResize() {
      const element = document.querySelector(".left-navbar"); // Thay '.element-class' bằng lớp bạn muốn theo dõi

      if (window.innerWidth < 1200) {
        // Khi cửa sổ nhỏ hơn 768px, xóa class
        if (element) {
          element.classList.remove("col-6"); // Thay 'some-class' bằng lớp cần xóa
        }
      } else {
        // Nếu bạn muốn thêm lại class khi kích thước lớn hơn 768px
        if (element) {
          element.classList.add("col-6"); // Thay 'some-class' bằng lớp cần thêm lại
        }
      }
    },
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.handleResize);
  },
};
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
}

.countdown-timer {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  background-color: #007bff;
  /* Màu nền xanh */
  border: 2px solid #0056b3;
  /* Viền xanh đậm */
  border-radius: 5px;
  /* Bo góc */
  padding: 10px;
  /* Khoảng cách bên trong */
  margin-right: 10px;
  margin-left: 10px;
  /* Khoảng cách giữa đếm ngược và logo */
}

.site-navbar {
  background: rgba(108, 117, 125, 0.5);
  /* bg-secondary màu mặc định là #6c757d */
  backdrop-filter: blur(10px);
  /* Làm mờ nền */
  border: 1px solid rgba(255, 255, 255, 0.2);
  /* Đường viền mờ */
  padding: 10px 10px;
  color: white;
  /* Chữ màu trắng để dễ đọc trên nền mờ */
  margin: 0;
}

img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  /* Đảm bảo rằng header luôn ở trên cùng */
}
</style>
