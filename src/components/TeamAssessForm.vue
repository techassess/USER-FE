<template>
  <!-- Evaluation Header -->
  <div class="evaluation-header text-start mb-2 d-flex justify-content-between">
    <label class="fw-bold fs-4">
      Đánh giá {{ selectedPerson ? selectedPerson.name : "một người" }} năm
      2024:
    </label>
    <div class="d-flex">
      <label class="fw-bold fs-4">Tổng điểm:
        <span class="text-danger">{{
          totalPoint ? totalPoint : "0"
        }}</span></label>
    </div>
  </div>

  <!-- Evaluation Form -->
  <form class="evaluation-form" @submit.prevent="submitForm">
    <!-- Performance Evaluation -->
    <div v-for="(criteria, criteriaIndex) in listCriteria" :key="criteria.id" class="section mb-4">
      <div class="d-flex justify-content-between">
        <label class="d-flex gap-2">
          <h4>{{ criteria.title }}</h4>
          <span class="text-danger fw-bold">*</span>
        </label>
        <div v-if="criteria.point" class="multi">
          {{
            listScore[criteriaIndex]?.totalOfCriteria !== undefined
              ? listScore[criteriaIndex].totalOfCriteria
              : "?"
          }}
          / {{ criteria.point }}
        </div>
      </div>

      <div v-if="criteria.questions && criteria.questions.length > 0">
        <div v-for="(question, questionIndex) in criteria.questions" :key="question.id" class="question mb-3">
          <div class="d-flex justify-content-between title" v-if="question.title">
            <label>
              {{ questionIndex + 1 }}. {{ question.title }}
              <span class="text-danger"> *</span>
            </label>
          </div>

          <div v-if="question.answers" class="options d-flex justify-content-around my-3">
            <div v-for="(answer, answerIndex) in question.answers" :key="answer.id" class="form-check">
              <input type="radio" :id="'performanceOption' +
                criteriaIndex +
                questionIndex +
                answerIndex
                " :name="'performance' + criteriaIndex + questionIndex" class="form-check-input" @change="
                  selectPerformanceValue(
                    criteria.id,
                    criteriaIndex,
                    question.id,
                    questionIndex,
                    answer.value
                  )
                  " :value="answer.value" />
              <label :for="'performanceOption' +
                criteriaIndex +
                questionIndex +
                answerIndex
                " class="form-check-label">{{ answer.title }}</label>
            </div>
          </div>
          <div class="description">
            <textarea v-if="isShowDescription(criteria.id, question.id)" class="form-control" :class="{
              'error-textarea': perfValues.assessDetails.find(
                (detail) =>
                  detail.criteriaId === criteria.id &&
                  detail.questionId === question.id
              )?.hasError,
            }" rows="3" placeholder="Nhận xét thêm" v-model="perfValues.assessDetails.find(
              (detail) =>
                detail.criteriaId === criteria.id &&
                detail.questionId === question.id
            ).description
              " :ref="'description_' + criteria.id + '_' + question.id"></textarea>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="form-group">
          <textarea class="form-control" :class="{
            'error-textarea': perfValues.assessDetails?.find(
              (detail) => detail.criteriaId === criteria.id
            )?.hasError,
          }" rows="5" :value="perfValues.assessDetails?.find(
            (detail) => detail.criteriaId === criteria.id
          )?.description || ''
            " @input="updateDescription(criteria.id, $event.target.value)" placeholder="Nhập nội dung..."></textarea>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <div class="d-flex justify-content-end">
      <button class="btn btn-primary" type="submit">Gửi Đánh Giá</button>
    </div>
  </form>
</template>

<script>
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import AssessService from "@/services/AssessService";
export default {
  name: "TeamAssessForm",
  props: {
    selectedPerson: Object,
  },
  emits: ["updateSelectedPerson"],
  data() {
    return {
      userInfo: null,
      listCriteria: [],
      perfValues: {},
      listScore: [],
      sortKey: "name",
      sortOrder: "asc",
      totalPoint: 0,
      userRole: "manager",
    };
  },

  mounted() {
    window.onload = () => {
      localStorage.removeItem("assessDetails");
    };
    const user = localStorage.getItem("user");
    if (user) {
      this.userInfo = JSON.parse(user);
    }
    this.loadCriteria();
  },
  watch: {
    // xem description của từng ô nếu thay đổi thì cập nhật lên localStorage
    perfValues: {
      handler() {
        localStorage.setItem("assessDetails", JSON.stringify(this.perfValues));
      },
      deep: true,
    },
  },
  methods: {
    async loadCriteria() {
      try {
        const res = await AssessService.fetchListData();
        if (res.code === 1010) {
          this.listCriteria = res.data;
        }
        if (
          this.userInfo.userRoles.some(
            (usRole) => usRole.role.name === "MANAGER"
          )
        ) {
          this.listCriteria = this.listCriteria.filter(
            (c) =>
              c.title !== "Đóng góp cá nhân và kết quả" &&
              c.title !== "Mục tiêu quý tiếp theo"
          );
        } else {
          this.listCriteria = this.listCriteria.filter(
            (c) =>
              c.title !== "Đóng góp cá nhân và kết quả" &&
              c.title !== "Đánh giá của quản lý" &&
              c.title !== "Mục tiêu quý tiếp theo"
          );
        }
        this.initPerfValues();
      } catch (error) {
        console.error("Error fetching criteria list:", error);
      }
    },
    initPerfValues() {
      this.perfValues.assessDetails = [];

      // Khởi tạo assessDetails dựa trên số lượng tiêu chí và câu hỏi
      const criteriaCount = this.listCriteria.length; // Số lượng tiêu chí

      for (let i = 0; i < criteriaCount; i++) {
        const questions = this.listCriteria[i]?.questions;
        const questionsCount = questions ? questions.length : 0;

        if (questionsCount === 0) {
          this.perfValues.assessDetails.push({
            criteriaId: this.listCriteria[i].id, // Lưu ID của tiêu chí
            questionId: null, // Lưu ID của câu hỏi
            value: null, // Giá trị của câu hỏi
            description: null, // Mô tả của câu hỏi
            hasError: false, // Trạng thái lỗi
          });
        } else {
          for (let j = 0; j < questionsCount; j++) {
            this.perfValues.assessDetails.push({
              criteriaId: this.listCriteria[i].id, // Lưu ID của tiêu chí
              questionId: questions[j].id, // Lưu ID của câu hỏi
              value: null, // Giá trị của câu hỏi
              description: null, // Mô tả của câu hỏi
              hasError: false, // Trạng thái lỗi
            });
          }
        }
      }
    },
    updateDescription(criteriaId, value) {
      if (!this.perfValues.assessDetails) {
        this.initPerfValues();
      }
      const assessDetail = this.perfValues.assessDetails.find(
        (detail) => detail.criteriaId === criteriaId
      );
      if (assessDetail) {
        assessDetail.description = value;
      }
    },
    async submitForm() {
      let allDescriptionsFilled = true;
      let allValuesSelected = true;
      let firstErrorRef = null;

      this.perfValues.assessDetails.forEach((detail) => {
        const isCriteriaToCheck = detail.criteriaId !== 8;
        // Kiểm tra xem giá trị đã được chọn hay chưa
        if (isCriteriaToCheck && (!detail.value || detail.value === 0)) {
          allValuesSelected = false;
        }

        // Kiểm tra mô tả nếu có giá trị
        if (detail.value >= 3 && isCriteriaToCheck) {
          const isDescriptionFilled =
            detail.description && detail.description.trim() !== "";
          if (!isDescriptionFilled) {
            allDescriptionsFilled = false;
            detail.hasError = true; // Đánh dấu ô mô tả có lỗi
            if (!firstErrorRef) {
              firstErrorRef =
                this.$refs[
                `description_${detail.criteriaId}_${detail.questionId}`
                ][0]; // Lưu lại phần mô tả đầu tiên có lỗi
            }
          } else {
            detail.hasError = false; // Đặt lại trạng thái lỗi nếu có mô tả
          }
        }
        if (
          !isCriteriaToCheck &&
          (!detail.description || detail.description.trim() === "")
        ) {
          allDescriptionsFilled = false;
          detail.hasError = true;
        }
      });

      if (!allValuesSelected) {
        toast.error("Vui lòng chọn giá trị cho tất cả các câu hỏi!");
        return;
      }

      if (!allDescriptionsFilled) {
        toast.error("Vui lòng điền tất cả các mô tả!");
        if (firstErrorRef) {
          firstErrorRef.focus(); // Tập trung vào ô mô tả đầu tiên có lỗi
        }
        return;
      }

      this.perfValues.assessDetails.forEach((detail) => {
        if (!detail.hasError) {
          delete detail.hasError;
        }
      });
      console.log(this.perfValues);
      console.log("Total point submit form response:: ", this.totalPoint);

      // Thử gửi dữ liệu
      try {
        const res = await AssessService.submitForm(
          this.userInfo.id,
          this.selectedPerson.id,
          this.totalPoint,
          this.perfValues
        );
        if (res.code === 201) {
          toast.success("Đánh giá thành công!", {
            autoClose: 2000,
          });

          // Ẩn form đi 
          this.wDisplay = !this.wDisplay;

        } else {
          toast.error("Đánh giá thất bại. Vui lòng quay lại sau!");
          return;

        }
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        toast.error("Đánh giá thất bại. Vui lòng quay lại sau!");
        console.error("Error submitting form:", error);
      }
    },
    calculateWorkTime() {
      const userInfo = localStorage.getItem("userInfo");
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
    isShowDescription(criteriaId, questionId) {
      // Kiểm tra xem assessDetails có tồn tại và lấy câu hỏi tương ứng
      const question = this.perfValues.assessDetails?.find(
        (detail) =>
          detail.criteriaId === criteriaId && detail.questionId === questionId
      );

      // Kiểm tra điều kiện để hiển thị mô tả
      return question && question.value >= 3;
    },
    selectPerformanceValue(
      criteriaId,
      criteriaIndex,
      questionId,
      questionIndex,
      value
    ) {
      // Giả sử bạn đã khởi tạo perfValues.assessDetails trước đó
      if (!this.perfValues.assessDetails) {
        this.perfValues.assessDetails = [];

        // Khởi tạo assessDetails dựa trên số lượng tiêu chí và câu hỏi
        const criteriaCount = this.listCriteria.length; // Số lượng tiêu chí

        for (let i = 0; i < criteriaCount; i++) {
          const questions = this.listCriteria[i]?.questions; // Lấy danh sách câu hỏi cho tiêu chí này
          const questionsCount = questions ? questions.length : 0; // Số lượng câu hỏi cho tiêu chí này

          for (let j = 0; j < questionsCount; j++) {
            this.perfValues.assessDetails.push({
              criteriaId: this.listCriteria[i].id, // Lưu ID của tiêu chí
              questionId: questions[j].id, // Lưu ID của câu hỏi
              value: null, // Giá trị của câu hỏi
              description: null, // Mô tả của câu hỏi
              hasError: false, // Trạng thái lỗi
            });
          }
        }
      }

      // Tìm đối tượng assessDetail tương ứng
      const assessDetail = this.perfValues.assessDetails.find(
        (detail) =>
          detail.criteriaId === criteriaId && detail.questionId === questionId
      );

      // Cập nhật giá trị đã chọn cho câu hỏi
      if (assessDetail) {
        assessDetail.value = value;

        // Xóa ô nhập "description" nếu giá trị < 3
        if (value < 3) {
          assessDetail.description = null; // Hoặc "" tùy thuộc vào yêu cầu
        }
      }

      // Cập nhật listScore để hiển thị
      if (!this.listScore[criteriaIndex]) {
        this.listScore[criteriaIndex] = {};
      }

      // Tính toán điểm mới cho câu hỏi
      const newScore = this.calculateScoreSelected(
        criteriaIndex,
        questionIndex,
        value
      );

      // Cập nhật điểm cho câu hỏi
      this.listScore[criteriaIndex][questionIndex] = newScore;

      // Kiểm tra xem tất cả câu hỏi của tiêu chí này đã được trả lời chưa
      const questionsCount =
        this.listCriteria[criteriaIndex]?.questions?.length || 0;
      const answeredQuestionsCount = Object.keys(
        this.listScore[criteriaIndex]
      ).filter((key) => key !== "totalOfCriteria").length;

      // Tính lại totalOfCriteria khi có sự thay đổi
      if (answeredQuestionsCount === questionsCount) {
        const totalOfCriteria = this.calculateTotalOfCriteria(criteriaIndex);
        const percentage = Math.round(
          ((totalOfCriteria * 20) / 100) *
          (this.listCriteria[criteriaIndex]?.point || 1)
        );

        // Cập nhật tổng điểm tiêu chí
        this.listScore[criteriaIndex].totalOfCriteria = percentage;
      }

      // Cập nhật tổng điểm cho tất cả các tiêu chí
      this.updateTotalPoint();

      // Lưu assessDetails vào localStorage
      localStorage.setItem("assessDetails", JSON.stringify(this.perfValues));
    },
    calculateScoreSelected(criteriaIndex, questionIndex, value) {
      // Lấy thông tin câu hỏi tương ứng từ listCriteria
      const question =
        this.listCriteria[criteriaIndex]?.questions[questionIndex];
      const pointCriteria =
        parseFloat(this.listCriteria[criteriaIndex]?.point) || 1; // Điểm tiêu chí
      const questionScore = parseFloat(question?.point) || 0; // Điểm của câu hỏi
      const selectedValue = parseFloat(value) || 0; // Giá trị được chọn

      // Tính toán điểm cho câu hỏi này
      const score = (questionScore / pointCriteria) * selectedValue;

      // Làm tròn điểm đến 2 chữ số sau dấu phẩy
      return Math.round(score * 100) / 100;
    },
    calculateTotalOfCriteria(criteriaIndex) {
      const listScoreForCriteria = this.listScore[criteriaIndex] || {};
      let total = 0;

      for (const questionIndex in listScoreForCriteria) {
        if (
          Object.prototype.hasOwnProperty.call(
            listScoreForCriteria,
            questionIndex
          ) &&
          questionIndex !== "totalOfCriteria"
        ) {
          total += listScoreForCriteria[questionIndex];
        }
      }

      return Math.round(total * 100) / 100; // Trả về tổng điểm đã làm tròn
    },
    updateTotalPoint() {
      this.totalPoint = Object.keys(this.listScore).reduce(
        (total, criteriaId) => {
          const criteriaScore = this.listScore[criteriaId].totalOfCriteria || 0; // Đảm bảo giá trị là số
          return total + criteriaScore; // Cộng dồn tổng điểm
        },
        0
      );
    },
  },
};
</script>

<style scoped>
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

.evaluation-form {
  flex: 1;
  /* Take up remaining space */
  padding: 20px;
  border-radius: 8px;
  overflow-y: auto;
  /* Allow scrolling if content overflows */
}

.evaluation-header {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.evaluation-form .title {
  background-color: #99c6f8;
  padding: 10px;
  border-radius: 5px;
}

.point {
  color: red;
}

.evaluation-form .content {
  padding-left: 20px;
}

.content>p {
  color: black;
}

.evaluation-form .form-check-label {
  font-weight: normal;
}

.evaluation-form::-webkit-scrollbar {
  width: 8px;
}

.evaluation-form::-webkit-scrollbar-thumb {
  background-color: #aaa;
  border-radius: 10px;
}

.evaluation-form::-webkit-scrollbar-thumb:hover {
  background-color: #888;
}

/* Form Buttons */
.form-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #ddd;
  position: sticky;
  bottom: 0;
  width: 100%;
  z-index: 10;
  position: absolute;
}
</style>
