<template>
  <div
    class="container-fluid row justify-content-md-center align-items-center"
    v-if="profile"
  >
    <!-- Left Menu -->
    <div
      :class="[
        'left-menu p-3 d-flex flex-column',
        !userInfo.userRoles.some(
          (role) => role.role.id === 3 && role.role.name === 'MANAGER'
        ) && !firstUnsubmitted
          ? 'col-md-8'
          : 'col-md-4',
      ]"
    >
      <div
        :class="[
          'profile mb-3 d-flex align-items-center justify-content-around',
          !userInfo.userRoles.some(
            (role) => role.role.id === 3 && role.role.name === 'MANAGER'
          ) && !firstUnsubmitted
            ? 'd-none'
            : 'd-flex',
        ]"
      >
        <div class="avatar">
          <img
            :src="profile.fileInfo?.fileUrl || defaultImage"
            alt="avatar"
          />
        </div>
        <div class="info ms-3 text-start">
          <h3 class="mb-2">{{ profile.name }}</h3>
          <div class="line">
            <strong>Vị trí:</strong> {{ profile.rank.position.name }}
          </div>
          <div class="line" v-if="checkRole('MANAGER')">
            <strong>Bậc hiện tại:</strong> {{ profile.rank.level }}
          </div>
          <div class="line">
            <strong>Dự án hiện tại:</strong> {{ profile.userProjects[0].name }}
          </div>
          <div class="line"><strong>Bộ phận:</strong> {{ departmentName }}</div>
        </div>
      </div>
      <div class="team-mate">
        <div class="text-start fw-bold">
          Danh sách thành viên có chung dự án hiện tại:
        </div>
        <table class="table">
          <thead class="thead-light">
            <tr>
              <th>#</th>
              <th
                @click="sortBy('name')"
                class="text-start"
                style="cursor: pointer"
              >
                Tên
              </th>
              <th>Vị Trí</th>
              <th>Tác Vụ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mate, index) in teamMates" :key="index">
              <td>{{ index + 1 }}</td>
              <td class="text-start">{{ mate.name }}</td>
              <td>{{ mate?.rank?.position.name }}</td>
              <td class="d-flex justify-content-center">
                <div class="d-flex">
                  <button
                    v-if="mate.isSubmitted && !checkRole('MANAGER')"
                    class="btn btn-sm btn-success btn-custom"
                    :disabled="true"
                  >
                    Đã đánh giá
                  </button>
                  <button
                    v-else-if="mate.isProcessing"
                    class="btn btn-sm btn-warning btn-custom"
                    :disabled="true"
                  >
                    Đang đánh giá
                  </button>
                  <button
                    v-else-if="!mate.isSubmitted"
                    class="btn btn-sm btn-primary btn-custom"
                    @click="selectPerson(mate)"
                  >
                    Đánh giá
                  </button>
                </div>
                <div v-if="checkRole('MANAGER')">
                  <button
                    v-if="mate.isViewing"
                    class="btn btn-sm btn-warning btn-custom"
                    :disabled="true"
                  >
                    Đang xem
                  </button>
                  <button
                    v-if="mate.isSubmitted && !mate.isViewing"
                    class="btn btn-sm btn-info btn-custom"
                    @click="viewPerson(mate)"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="footer d-flex align-items-center" v-if="isViewing">
        <div class="circle-container me-3">
          <span class="circle circle-blue"></span>
          <span>Người quản lý</span>
        </div>
        <div class="circle-container">
          <span class="circle circle-green"></span>
          <span>Nhân viên đang được xem</span>
        </div>
      </div>
    </div>

    <!-- Right Menu -->
    <div
      :class="[
        'col-md-8 right-menu p-4',
        {
          'd-none':
            !userInfo.userRoles.some(
              (role) => role.role.id === 3 && role.role.name === 'MANAGER'
            ) && !firstUnsubmitted,
        },
        {
          'd-flex': userInfo.userRoles.some(
            (role) => role.role.id === 3 && role.role.name === 'MANAGER'
          ),
        },
      ]"
    >
      <component
        :is="isViewing ? 'TeamAssessDetailsForm' : 'TeamAssessForm'"
        :selectedPerson="selectedPerson"
        :userInfo="userInfo"
        @updateSelectedPerson="handleUpdateSelectedPerson"
      />
    </div>
  </div>
</template>
<script>
import "vue3-toastify/dist/index.css";
import TeamAssessDetailsForm from "./TeamAssessDetailsForm.vue";
import TeamAssessForm from "./TeamAssessForm.vue";
import UserService from "@/services/UserService.js";
import { toast } from "vue3-toastify";
import AssessService from "@/services/AssessService";
import ProjectService from "@/services/ProjectService";
// import AuthService from "@/services/AuthService";
import defaultImage from "@/assets/avata.png";

export default {
  name: "TeamMatesAssess",
  components: {
    TeamAssessForm,
    TeamAssessDetailsForm,
  },
  data() {
    return {
      firstUnsubmitted: 1,
      userInfo: null,
      profile: null,
      teamMates: [],
      selectedPerson: null,
      sortKey: "name",
      sortOrder: "asc",
      isViewing: false,
      listScore: [],
      isAssess: false,
      assessDetails: [],
      departmentName: "",
      defaultImage: defaultImage,
    };
  },
  mounted() {
    const user = localStorage.getItem("user");
    if (user) {
      this.userInfo = JSON.parse(user);
    }
    this.fetchTeamMates();
    this.fetchAssessByUser();
    this.loadDepartment();
  },
  computed: {
    sortedTeamMates() {
      return [...this.filteredTeamMates].sort((a, b) => {
        let comparison = 0;
        if (a[this.sortKey] > b[this.sortKey]) {
          comparison = 1;
        } else if (a[this.sortKey] < b[this.sortKey]) {
          comparison = -1;
        }
        return this.sortOrder === "asc" ? comparison : -comparison;
      });
    },
  },
  methods: {
    async loadDepartment() {
      const departmentId = localStorage.getItem("userDepartmentId");
      if (!departmentId) {
        this.departmentName = "Chưa xác định"; // Đặt giá trị mặc định nếu không tìm thấy
        return;
      }

      try {
        const department = await AssessService.fetchListData(departmentId);
        this.departmentName = department?.data?.name || "Chưa xác định";
      } catch (error) {
        console.error("Error fetching department:", error);
        this.departmentName = "Chưa xác định";
      }
    },
    checkRole(role) {
      return this.userInfo.userRoles.some(
        (usRole) => usRole.role.name === role
      );
    },
    initializeUserInfo() {
      const user = localStorage.getItem("user");
      if (user) {
        this.userInfo = JSON.parse(user);
      }
    },
    async fetchAssessByUser() {
      try {
        const res = await AssessService.fetchAssessByUser(this.userInfo.id);
        if (res && res.code === 1010) {
          this.updateAssessmentStatus();
        }
      } catch (error) {
        console.error("Error fetching assessments:: ", error);
      }
    },

    async fetchTeamMates() {
      try {
        const loggedInUserId = this.userInfo.id;
        const res = await UserService.fetchTeamsByUserId(loggedInUserId);
        if (!res) {
          toast.error("Bạn không đang trong dự án nào");
          return;
        }

        // Bảo toàn các trạng thái cũ
        this.teamMates = res.data.map((person) => {
          const existingMember = this.teamMates.find(
            (mate) => mate.id === person.id
          );

          return {
            ...person,
            isViewing: existingMember ? existingMember.isViewing : false,
            isProcessing: existingMember ? existingMember.isProcessing : false,
            isSubmitted: existingMember ? existingMember.isSubmitted : false,
          };
        });
        const fetchProjectPromises = this.teamMates.map(async (mate) => {
          const projectPromises = mate.userProjects.map(async (record) => {
            const res = await ProjectService.fetchProjectById(record.projectId);
            if (res.code === 1010) {
              // Thay vì push vào userProjects, nên thay thế hoặc thêm vào một danh sách riêng
              return res.data; // Trả về dữ liệu dự án
            }
          });

          // Chờ tất cả các dự án được fetch xong
          const projects = await Promise.all(projectPromises);
          // Lọc ra các dự án hợp lệ và thêm vào userProjects
          mate.userProjects = projects.filter(
            (project) => project !== undefined
          );
        });

        await Promise.all(fetchProjectPromises);

        // Gọi hàm fetchAssessByUser
        await this.fetchAssessByUser();

        // Chọn thành viên đầu tiên chưa nộp
        const firstUnsubmitted = this.teamMates.find(
          (person) => !person.isSubmitted
        );

        if (firstUnsubmitted) {
          firstUnsubmitted.isProcessing = true;
          this.selectedPerson = firstUnsubmitted;
          this.profile = firstUnsubmitted;
          this.isViewing = false;
        } else {
          // Check thêm nếu role là user bình thường thì ẩn
          // Check role là manager thì vẫn cho hiện cái firstUnsubmitted
          this.profile = this.teamMates[0];
          this.selectedPerson = this.teamMates[0];
          this.firstUnsubmitted = null;
          this.isViewing = true;

          // Đặt isViewing của người đầu tiên thành true, các người khác là false
          this.teamMates.forEach((member) => (member.isViewing = false));
          this.teamMates[0].isViewing = true;
        }
        localStorage.setItem("userDepartmentId", this.profile.departmentId);
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    },
    updateAssessmentStatus() {
      this.assessBy = JSON.parse(
        localStorage.getItem("assess-by-user" + this.userInfo.id)
      );
      if (this.assessBy) {
        this.teamMates.forEach((person) => {
          const assess = this.assessBy.find(
            (assess) => assess.toUserId === person.id
          );
          if (assess) {
            person.isSubmitted = true;
          }
        });
      }
    },
    viewPerson(person) {
      if (this.selectedPerson && this.selectedPerson.isProcessing) {
        this.selectedPerson.isProcessing = false;
      }

      if (this.selectedPerson !== person) {
        if (this.selectedPerson) {
          this.selectedPerson.isViewing = false;
        }
        this.selectedPerson = person;
        person.isViewing = true;
        person.isProcessing = false;
        this.profile = person;
        console.log(this.isViewing);
      } else {
        person.isViewing = !person.isViewing;
      }
      // Đặt tất cả trạng thái isViewing của teamMates thành false
      this.teamMates.forEach((member) => (member.isViewing = false));

      // Đánh dấu thành viên được chọn là đang xem
      person.isViewing = true;

      // Cập nhật thông tin hiển thị
      this.selectedPerson = person;
      this.profile = person;
      this.isViewing = true;
    },
    selectPerson(person) {
      if (this.listScore.length > 0) {
        if (window.confirm("Bạn có chắc thay đổi người để đánh giá không ?")) {
          if (window.confirm("Dữ liệu đã nhập sẽ bị xóa!")) {
            this.selectedPerson.isProcessing = false;
            this.clearForm();
          }
        }
      }

      if (this.selectedPerson && this.selectedPerson.isViewing) {
        this.selectedPerson.isViewing = false;
      }

      if (this.selectedPerson !== person) {
        if (this.selectedPerson) {
          this.selectedPerson.isProcessing = false;
        }
        this.selectedPerson = person;
        person.isViewing = false;
        person.isProcessing = true;
        this.profile = person;
      } else {
        // Nếu người được nhấn là cùng một người, chuyển đổi trạng thái
        person.isProcessing = !person.isProcessing;
      }
      this.isViewing = false;
      localStorage.setItem(
        "userDepartmentId",
        this.selectedPerson.departmentId
      );
    },
    sortBy(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        this.sortKey = key;
        this.sortOrder = "asc";
      }
    },
    calculateWorkTime() {
      const userInfo = localStorage.getItem("userInfo");
      console.log(
        "userInfo.userRoles.some(role => role.role.id !== 3 && role.role.name !== 'MANAGER') : ",
        userInfo
      );

      if (userInfo && userInfo.dateJoinCompany) {
        const joinDate = new Date(userInfo.dateJoinCompany);
        const currentDate = new Date();

        let years = currentDate.getFullYear() - joinDate.getFullYear();
        let months = currentDate.getMonth() - joinDate.getMonth();
        let days = currentDate.getDate() - joinDate.getDate();

        if (days < 0) {
          months--;
          days += new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            0
          ).getDate();
        }

        if (months < 0) {
          years--;
          months += 12;
        }

        let result = [];

        if (years > 0) {
          result.push(`${years} năm`);
        }
        if (months > 0) {
          result.push(`${months} tháng`);
        }
        if (days > 0) {
          result.push(`${days} ngày`);
        }

        return result.length > 0 ? result.join(" ") : "Chưa xác định";
      }
      return "Chưa xác định";
    },
    handleUpdateSelectedPerson(updatedPerson) {
      this.selectedPerson = null;
      //update selectedPerson vào teamMates
      const index = this.teamMates.findIndex(
        (person) => person.id === updatedPerson.id
      );
      if (index !== -1) {
        this.teamMates[index] = updatedPerson;
      }
    },
  },
  watch: {
    profile: {
      immediate: true, // Gọi ngay khi profile thay đổi
      handler(newProfile) {
        if (newProfile?.departmentId) {
          localStorage.setItem("userDepartmentId", newProfile.departmentId);
          this.loadDepartment();
        }
      },
    },
  },
};
</script>

<style scoped>
.footer {
  display: flex;
  justify-content: center;
  /* Tách đều các phần tử ra */
}

.circle-container {
  display: flex;
  align-items: center;
  gap: 8px;
  /* Khoảng cách giữa hình tròn và chữ */
}

.circle {
  width: 20px;
  /* Kích thước hình tròn */
  height: 20px;
  border-radius: 50%;
  /* Tạo hình tròn */
  border: 3px solid blue;
  /* Đặt viền với màu theo ý muốn */
  background-color: white;
  /* Màu nền của hình tròn */
}

.circle-blue {
  border-color: blue;
  /* Màu viền xanh dương */
}

.circle-green {
  border-color: rgb(43, 255, 0);
  /* Màu viền xanh lá */
}

.left-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  /* Chỉnh chiều cao phù hợp */
}

.footer {
  margin-top: auto;
}

/* Left menu */
.btn-custom {
  width: 130px;
}

tbody > tr > td {
  vertical-align: middle;
}

.container-fluid {
  background-color: #4e7fcf;
  min-height: 100vh;
  padding-top: 100px;
  padding-bottom: 100px;
  margin: 0 auto;
  height: 100%;
}

.section h5 {
  font-weight: bold;
  text-transform: uppercase;
}

.left-menu {
  background-color: #f7f7f7;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin-left: 20px;
  height: 80vh;
  margin-top: 25px;
}

.profile {
  background-color: #f7f7f7;
  /* backdrop-filter: blur(10px);*/
  border: 3px solid rgba(44, 113, 241, 0.1);
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 16px 16px rgba(1, 41, 116, 0.1);
  max-width: 450px;
  margin: 0 auto;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #007bff;
  /* Add a border around the avatar */
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info h4 {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}

.line {
  font-size: 16px;
  margin-bottom: 5px;
  line-height: 1.5;
}

.line strong {
  color: #007bff;
  /* Highlight the labels with a color */
}

/* Team Mate Table */

.team-mate .table {
  font-size: 14px;
  margin-top: 20px;
}

/* Right Menu Styles */
.error-textarea {
  border: 2px solid red;
  /* Đặt viền đỏ */
}

.multi {
  color: red;
  font-weight: bold;
  font-size: 16px;
}

.right-menu {
  height: 80vh;
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  height: 80vh;
  margin-right: 20px;
  margin-top: 25px;
  margin-left: 20px;
}

.content > p {
  color: black;
}

.hidden {
  display: none !important;
}
</style>
