<template>
  <div class="background-container">
    <div class="container-fluid p-5">
      <div class="rows content justify-content-md-center align-items-center gap-3">
        <div class="col-md-5 left-content">
          <div class="profile-score-container d-flex justify-content-between align-items-start mb-5">
            <div class="profile d-flex align-items-center">
              <div class="avatar">
                <img :src="userInfo.fileInfo ? userInfo.fileInfo.fileUrl : profileImage" alt="avatar" />
              </div>
              <div class="info ms-3 text-start">
                <h3 class="mb-2">{{ userInfo.name }}</h3>
                <div class="line">
                  <strong>Vị trí:</strong> {{ userInfo.rank.position.name }}
                </div>
                <div class="line">
                  <strong>Bậc hiện tại:</strong> {{ userInfo.rank.level }}
                </div>
                <div class="line">
                  <strong>Dự án hiện tại:</strong> {{ userInfo.userProjects[0].name }}
                </div>
                <div class="line">
            <strong>Bộ phận:</strong> {{ departmentName }}
          </div>
              </div>
            </div>
            <div class="total-score d-flex flex-column font-weight-bold justify-content-end gap-2">
              <label class="form-label">Tổng điểm đánh giá quý này: <span class="score">{{ totalPoint ? totalPoint : "?"
                  }}</span></label>
              <label class="form-label">Xếp hạng:
                <span class="score" v-if="this.totalPoint == 0">?</span>
                <span class="score" v-else>{{ rank }}</span>
              </label>
              <label class="form-label align-items-center">Đề xuất nâng:
                <span class="score me-2 fw-bold fs-2 " v-if="this.totalPoint == 0"> ? </span>
                <span class="score me-2 fw-bold fs-2 " v-else> {{ levelUp }} </span>
                bậc
              </label>
            </div>
          </div>

          <div v-if="selfAssessment.length == 0 || teamsAssessment.length == 0 || managerAssessment.length == 0">
            <span class="fs-4 text-danger">Chưa có kết quả đánh giá, vui lòng đợi đến ngày có kết quả.</span>
          </div>

          <div v-else class="table-wrapper">
            <table class="styled-table">
              <thead>
                <tr>
                  <th>Hệ số</th>
                  <th class="text-start">Tiêu Chí</th>
                  <th>Tự đánh giá</th>
                  <th>Tổng Điểm</th>
                </tr>
              </thead>
              <tbody v-for="(criteria, criteriaIndex) in selfCriteriaScores" :key="criteriaIndex">
                <tr>
                  <td>{{ criteria.totalPoint }}</td>
                  <td class="text-start">{{ criteria.title }}</td>
                  <td>{{ criteria.averageScore }}</td>
                  <td>{{
                    finalScores[criteriaIndex]?.averageScore
                      ? Math.round(finalScores[criteriaIndex].averageScore / 5 * criteria.totalPoint)
                      : '?'
                  }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="col-md-7 right-content">
          <!-- <RadarChart :data="radarData" /> -->
          <div class="note-container text-start">
            <label for="note"><strong>Đánh giá từ phía quản lý:</strong></label>
            <div v-if="showNote" class="note-section d-flex gap-3">
              <p id="note" class="note-display">{{ note ? note : "Chưa có đánh giá từ phía quản lý, vui lòng đợi." }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import RadarChart from "./RadarChart.vue";
import AssessService from "@/services/AssessService";
import AuthService from "@/services/AuthService";
export default {
  name: "AssessResult",
  components: {
    // RadarChart,
  },
  data() {
    return {
      showNote: true,
      radarData: {
        labels: [],
        selfAssessment: [],
        manager: [],
        team: [],
      },
      assessData: [],
      userInfo: null,
      totalPoint: 0,
      levelUp: null,
      rank: "",
      note: "",
      selfAssessment: [],
      selfCriteriaScores: [],
      teamsAssessment: [],
      managerAssessment: [],
      managerCriteriaScores: [],
      averageTeamPoint: 0,
      managerPoint: 0,
      departmentName:"",
      defaultAvatar:
        "https://png.pngtree.com/png-clipart/20231216/original/pngtree-vector-office-worker-staff-avatar-employee-icon-png-image_13863941.png",
      selfCriterias: [],
      finalScores: [],
    };
  },
  created() {
    const user = localStorage.getItem("user");
    if (user) {
      this.userInfo = JSON.parse(user);
    }
  },
  mounted() {
    this.getTypeAssess();
    this.loadDepartment();
  },
  methods: {
    async loadDepartment() {
    this.departmentName = await this.currentDepartment();
  },
    async getTypeAssess() {
      await AssessService.fetchTypeAssessByUserId(this.userInfo.id)

      this.selfAssessment = JSON.parse(localStorage.getItem("self-assessment")) || {};
      this.teamsAssessment = JSON.parse(localStorage.getItem("team-assessment")) || {};
      this.managerAssessment = JSON.parse(localStorage.getItem("manager-assessment")) || {};

      console.log("Self Assessment:", this.selfAssessment);
      console.log("Team Assessment:", this.teamsAssessment);
      console.log("Manager Assessment:", this.managerAssessment);

      this.calculateAllAverageScores();
      this.finalScores = this.calColumnTotalScore();
      this.calculateTotalPoint();
      this.calculateRankAndLevelUp();
      this.setManagerAssessmentNote();
    },

    calculateAverageScores(assessmentData) {
      if (!assessmentData) {
        console.error("Invalid assessment data:", assessmentData);
        return {};
      }
      const criteriaScores = {};

      // Duyệt qua từng chi tiết trong dữ liệu đánh giá
      assessmentData.forEach(assess => {
        assess.assessDetails.forEach((detail) => {
          if (detail.question) {
            const criteriaId = detail.criteria.id;
            const questionPoint = detail.question.point;
            const questionValue = detail.value;

            // Nếu tiêu chí chưa tồn tại trong criteriaScores, khởi tạo nó
            if (!criteriaScores[criteriaId]) {
              criteriaScores[criteriaId] = {
                totalValue: 0,
                totalPoint: 0,
                title: detail.criteria.title,
              };
            }

            // Cộng tổng điểm (value * point) và tổng hệ số của tiêu chí
            criteriaScores[criteriaId].totalValue += questionValue * questionPoint;
            criteriaScores[criteriaId].totalPoint += questionPoint;
          }
        });
      })

      // Tính điểm trung bình cho từng tiêu chí và lưu lại kết quả
      Object.keys(criteriaScores).forEach((criteriaId) => {
        const criteria = criteriaScores[criteriaId];
        criteria.averageScore = criteria.totalPoint > 0
          ? (criteria.totalValue / criteria.totalPoint).toFixed(2)
          : 0;

        console.log(`Average score for criteria ${criteria.title}: ${criteria.averageScore}`);
      });
      console.log('========================================');
      return criteriaScores;
    },
    calculateAllAverageScores() {
      this.selfCriteriaScores = this.calculateAverageScores(this.selfAssessment);
      this.managerCriteriaScores = this.calculateAverageScores(this.managerAssessment);

      // Xử lý teamAssessment có thể có nhiều phần tử
      const allTeamScores = this.teamsAssessment.map(team => this.calculateAverageScores([team])); // Tính toán điểm cho từng đội
      this.teamCriteriaScores = allTeamScores.reduce((acc, curr) => {
        Object.keys(curr).forEach(criteriaId => {
          if (!acc[criteriaId]) {
            acc[criteriaId] = curr[criteriaId];
          } else {
            acc[criteriaId].totalValue += curr[criteriaId].totalValue;
            acc[criteriaId].totalPoint += curr[criteriaId].totalPoint;
            acc[criteriaId].averageScore = acc[criteriaId].totalPoint > 0
              ? (acc[criteriaId].totalValue / acc[criteriaId].totalPoint).toFixed(2)
              : 0;
          }
        });
        return acc;
      }, {});

      console.log("Self Assessment Average Scores:", this.selfCriteriaScores);
      console.log("Manager Assessment Average Scores:", this.managerCriteriaScores);
      console.log("Team Assessment Average Scores:", this.teamCriteriaScores);

    },
    calColumnTotalScore() {
      // Khởi tạo object lưu điểm tổng kết
      const finalScores = {};

      // Duyệt qua từng tiêu chí trong selfCriteriaScores
      Object.keys(this.selfCriteriaScores).forEach((criteriaId) => {
        const selfScore = parseFloat(this.selfCriteriaScores[criteriaId]?.averageScore || 0);
        const managerScore = parseFloat(this.managerCriteriaScores[criteriaId]?.averageScore || 0);
        const teamScore = parseFloat(this.teamCriteriaScores[criteriaId]?.averageScore || 0);

        // Tính điểm tổng kết với hệ số cho mỗi loại đánh giá
        const totalScore = ((selfScore * 1) + (managerScore * 2) + (teamScore * 1)) / 4;

        // Lưu điểm tổng kết vào finalScores
        finalScores[criteriaId] = {
          title: this.selfCriteriaScores[criteriaId]?.title || "",
          totalPoint: this.selfCriteriaScores[criteriaId]?.totalPoint || "",
          averageScore: totalScore.toFixed(2),
        };
      });
      return finalScores;
    },
    calculateTotalPoint() {
      this.totalPoint = Object.keys(this.finalScores).reduce((sum, criteriaId) => {
        const criteria = this.finalScores[criteriaId];
        const score = Math.round(criteria.averageScore / 5 * criteria.totalPoint);
        return sum + score;
      }, 0);
    },
    calculateRankAndLevelUp() {
      if (this.totalPoint >= 90 && this.totalPoint <= 100) {
        this.rank = "A+";
        this.levelUp = 3;
      } else if (this.totalPoint >= 80 && this.totalPoint < 90) {
        this.rank = "A";
        this.levelUp = 2;
      } else if (this.totalPoint >= 70 && this.totalPoint < 80) {
        this.rank = "B+";
        this.levelUp = 1;
      } else if (this.totalPoint >= 50 && this.totalPoint < 70) {
        this.rank = "B";
        this.levelUp = 0;
      } else if (this.totalPoint >= 30 && this.totalPoint < 50) {
        this.rank = "C+";
        this.levelUp = 0;
      } else if (this.totalPoint < 30) {
        this.rank = "C";
        this.levelUp = 0;
      }
      console.log("Rank:", this.rank, "Level Up:", this.levelUp, this.totalPoint);
    },
    setManagerAssessmentNote() {
      console.log(this.managerAssessment[0]?.assessDetails);

      if (this.managerAssessment[0]?.assessDetails.length > 0) {
        const lastIndex = this.managerAssessment[0].assessDetails.length - 1;
        this.note = this.managerAssessment[0].assessDetails[lastIndex].description;
        console.log("NOTE:: ", this.note);
      } else {
        this.note = "Chưa có kết quả đánh giá từ phía quản lý, vui lòng đợi...";
      }
    },
    async currentDepartment() {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("User ID:", user.id);
      
      try {
        const department = await AuthService.fecthUserById(user.id);
        console.log("Department Data:", department);
        const departmentName = department.data?.userProjects[0]?.department?.name;
        console.log("Department Name:", departmentName);
        return departmentName || "Chưa xác định";  // Trả về tên phòng ban nếu có, nếu không thì trả về mặc định
      } catch (error) {
        console.error("Error fetching department:", error);
        return "Chưa xác định";  // Nếu có lỗi thì trả về giá trị mặc định
      }
    }

  }

};
</script>

<style scoped>
.background-container {
  background-color: #4e7fcf;
  margin: 0 auto;
  padding-top: 60px;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container-fluid {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 15px;
}

.content {
  display: flex;
  background-color: #ffffff;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
  max-width: 1500px;
  justify-content: space-between;
  flex-wrap: wrap;
}

.left-content,
.right-content {
  flex: 1 1 400px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 30px;
  min-height: 700px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.1);
}

.right-content {
  flex: 1;

  display: flex;

  flex-direction: column;


  align-items: center;

  background-color: #fff;

  border-radius: 10px;

  box-shadow: 0 10px 10px rgba(0, 0, 0, 0.1);

  width: 100%;

  max-width: 800px;
}

.left-content {
  display: flex;
  flex-direction: column;
}

.profile-score-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.profile {
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: auto;
  margin: 0 auto;
  display: flex;
  align-items: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info h3 {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.line {
  font-size: 18px;
  color: #555;
  margin-bottom: 8px;
  line-height: 1.5;
}

.line strong {
  color: #007bff;
}

.total-score {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  text-align: right;
}

.form-label {
  display: flex;
  justify-content: flex-start;
  font-weight: bold;
  color: #007bff;
  font-size: 19px;
}

.score {
  font-size: 18px;
  color: red;
  margin-left: 10px;
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 70px;
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
}

.styled-table thead tr {
  background-color: #4e7fcf;
  color: #ffffff;
}

.styled-table th,
.styled-table td {
  padding: 7px 10px;
  text-align: center;
}

@media (max-width: 992px) {
  .content {
    flex-direction: column;
  }

  .left-content,
  .right-content {
    width: 100%;
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .profile-score-container {
    flex-direction: column;
  }

  .profile,
  .total-score {
    width: 100%;
  }

  .avatar {
    margin-bottom: 15px;
  }

  .info {
    text-align: center;
  }
}

.right-content canvas {
  width: 100% !important;
  max-width: 400px;
}

.note-display {
  color: white;
  font-weight: bold;
}

.note-container {
  width: 100%;
}

.note-container label {
  text-decoration: underline;
  font-size: 19px;
}

.note-section {
  height: 100px;
  background-color: #4e7fcf;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(20, 13, 72, 0.1);
  margin: 0 auto;
  font-weight: bold;
}
</style>
