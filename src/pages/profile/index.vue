<template>
  <div class="background-container">
    <div class="container">
      <div class="profile" v-if="profile">
        <img
          :src="userInfo.fileInfo ? userInfo.fileInfo.fileUrl : profileImage"
          alt="Profile Picture"
        />
        <i
          class="fas fa-pencil-alt edit-icon edit-btn"
          @click="editProfile"
          title="EditProfile "
        ></i>
      </div>
      <div class="info" v-if="profile">
        <div class="name">
          <h1>{{ profile.name }}</h1>
        </div>
        <div class="details">
          <div class="detail">
            <label>Ngày sinh:</label>
            <span>{{ profile.dob }}</span>
          </div>
          <div class="detail">
            <label>Email:</label>
            <span>{{ profile.email }}</span>
          </div>
          <div class="detail">
            <label>Dự án hiện tại:</label>
            <span>{{ profile.userProjects[0].name }}</span>
          </div>
          <!-- <div class="detail">
            <label>Workday:</label>
            <span>{{ calculateWorkTime() }}</span>
          </div> -->
          <div class="detail">
            <label>Vị trí:</label>
            <span>{{ profile.rank.position.name }}</span>
          </div>
        </div>
      </div>
      <div class="friends-list">
        <div class="friends-header">
          <div class="search-bar">
            <input
              type="text"
              placeholder="Search Friends"
              v-model="searchTerm"
            />
          </div>
        </div>
        <div class="friends-row">
          <div
            class="friend-card"
            v-for="(mate, index) in filteredTeamMates"
            :key="index"
          >
            <img :src="mate.fileInfo?.fileUrl || defaultAvatar" alt="Avatar" />
            <h2>{{ mate.name }}</h2>
            <p>{{ mate.position }}</p>
          </div>
        </div>
      </div>

      <!-- Modal Edit Profile -->
      <div v-if="isEditing" class="modal">
        <div class="modal-content">
          <span class="close" @click="isEditing = false">&times;</span>
          <h2>Cập nhật ảnh đại diện</h2>
          <input type="file" @change="onFileChange" accept="image/*" />
          <button v-if="!isUpdating" class="btn btn-primary" @click="uploadAvatar">Lưu</button>
          <button v-else disabled class="btn btn-danger">Đang cập nhật</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";
import { toast } from "vue3-toastify";

export default {
  name: "ProfilePage",
  data() {
    return {
      userInfo: null,
      profile: null,
      teamMates: [],
      searchTerm: "",
      isEditing: false,
      defaultAvatar:
        "https://png.pngtree.com/png-clipart/20231216/original/pngtree-vector-office-worker-staff-avatar-employee-icon-png-image_13863941.png",
      avatarUpdate: null,
      isUpdating: false,
    };
  },
  mounted() {
    window.onload = () => {
      if (localStorage.getItem("accessToken")) {
        this.userInfo = JSON.parse(localStorage.getItem("user"));
      } else {
        this.$router.push({ path: "/login" });
      }
    };
  },
  watch: {
    userInfo: {
      handler() {
        if (this.userInfo) {
          this.profile = this.userInfo;
          this.fetchTeamMates();
        }
      },
      immediate: true,
    },
  },
  computed: {
    filteredTeamMates() {
      return this.teamMates.filter(
        (mate) =>
          mate.project === this.userInfo.project &&
          mate.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    },
  },
  methods: {
    editProfile() {
      this.isEditing = true; // Mở modal
    },
    onFileChange(event) {
      const file = event.target.files[0];
      this.avatarUpdate = file;
    },
    async uploadAvatar() {
  if (!this.avatarUpdate) {
    alert("No avatar selected!");
    return;
  }
  this.isUpdating = true;

  const formData = new FormData();
  formData.append("avatar", this.avatarUpdate);  // Đây là ảnh cần upload
  formData.append("request", JSON.stringify(this.userInfo));  // Thông tin người dùng nếu cần

  try {
    const response = await UserService.uploadAvatar(this.userInfo, formData);
    if (response.code === 1013) {
      toast.success("Cập nhật avatar thành công!");
      const res = await UserService.fetchUserById(this.userInfo.id);
      if (res.code === 1010) {
        localStorage.setItem("user", JSON.stringify(res.data));
      }
      this.userInfo = JSON.parse(localStorage.getItem("user"));
      this.isUpdating = false;
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  } catch (error) {
    console.error("Error uploading avatar:", error);
    toast.error("Không thể cập nhật avatar. Vui lòng thử lại.");
    this.isUpdating = false;
  }
},

    async fetchTeamMates() {
      if (!this.userInfo || !this.userInfo.id) {
        console.error("User information is not available.");
        return;
      }

      try {
        const response = await UserService.fetchTeamsByUserId(this.userInfo.id);
        if (response.data) {
          this.teamMates = response.data;
        } else {
          console.error("No team mates data found.");
        }
      } catch (error) {
        console.error("Error fetching team mates data:", error);
      }
    },
    calculateWorkTime() {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const diffDate = UserService.calculateWorkingTime(userInfo.createdAt);
        return `${diffDate.years} năm, ${diffDate.months} tháng, ${diffDate.days} ngày`;
      }
      return "Chưa xác định";
    },
  },
};
</script>

<style scoped>
.edit-btn:hover {
  cursor: pointer;
}
.background-container {
  background-color: #4e7fcf;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 100px;
}
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  max-width: auto;
  min-height: 80vh;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.profile img {
  border: 1px solid #ddd;
  width: 150px;
  height: 150px;
  border-radius: 50%;
}

.info {
  text-align: center;
  width: 100%;
  max-width: 800px;
}

.name {
  background-color: #f2f2f2;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
}

.name h1 {
  font-size: 28px;
  font-weight: bold;
}

.name .title {
  font-size: 18px;
  color: #888;
}

.details {
  display: grid;
  grid-template-columns: 150px 1fr; /* Cột đầu rộng 150px, cột sau tự động dãn */
  gap: 10px 20px; /* Khoảng cách giữa các dòng và các cột */
  align-items: center; /* Căn giữa các phần tử trong hàng */
}

.detail {
  display: contents; /* Để giữ các phần tử label và span nằm trên cùng một grid */
}

label {
  font-weight: bold;
  text-align: left; /* Căn chữ của label sát trái */
  position: relative; /* Sử dụng relative để căn dấu : */
  padding-right: 10px; /* Khoảng cách giữa chữ và dấu : */
}

label::after {
  content: ":"; /* Thêm dấu : */
  position: absolute;
  right: 0; /* Căn dấu : sát phải */
}
span {
  text-align: left; /* Căn trái cho giá trị */
}

.detail label {
  font-weight: bold;
}

.friends-list {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.friends-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

h1 {
  font-size: 26px;
}

.badge {
  background-color: #4caf50;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
  margin-left: 10px;
}

.search-bar {
  max-width: 350px;
  width: 100%;
  margin-right: 30px;
}

.search-bar input {
  width: 100%;
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.friends-row {
  display: flex;
  justify-content: center;
  gap: 25px;
  flex-wrap: wrap;
}

.friend-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 200px;
  background-color: #f9f9f9;
  border-radius: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.friend-card img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-bottom: 10px;
  border: 1px solid #ccc;
}

.friend-card h2 {
  font-size: 20px;
  margin-bottom: 5px;
}

.friend-card p {
  font-size: 16px;
  color: #666;
}
.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 400px;
  max-width: 90%;
  position: relative;
}

.close {
  color: #f00;
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover {
  color: #d00;
}

h2 {
  margin-top: 0;
  color: #333;
}

input[type="file"] {
  margin-top: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 8px;
}

button {
  margin-top: 15px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  background-color: #4e7fcf;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #3c6abf;
}
</style>
