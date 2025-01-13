<template>
  <div
    class="container-fluid row justify-content-md-center align-items-center"
    v-if="userInfo"
  >
    <!-- Left Menu -->
    <div class="col-md-4 left-menu p-3">
      <div
        class="profile mb-3 d-flex align-items-center justify-content-around"
      >
        <div class="avatar">
          <img :src="userInfo.fileInfo?.fileUrl || profileImage" alt="avatar" />
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
          <div class="line"><strong>Bộ phận:</strong> {{ departmentName }}</div>
        </div>
      </div>
      <h4 v-if="isAssess && isSubmitted" class="text-success">Bạn đã đánh giá cho bản thân</h4>
    </div>

    <!-- Right Menu -->
    <div class="col-md-8 right-menu p-4">
      <!-- Evaluation Header -->
      <div
        class="evaluation-header text-start mb-2 d-flex justify-content-between"
      >
        <label class="fw-bold fs-4"
          >Đánh giá quý III năm 2024 cho bản thân</label
        >
        <div class="d-flex">
          <label class="fw-bold fs-4"
            >Tổng điểm:
            <span v-if="isViewing == true" class="text-danger">{{
              this.personalAssess.totalPoint
                ? this.personalAssess.totalPoint
                : "0"
            }}</span>
            <span v-else class="text-danger">{{
              totalPoint ? totalPoint : "0"
            }}</span>
          </label>
        </div>
      </div>

      <!-- Evaluation Form -->
      <!-- @submit.prevent="submit" -->
      <form class="evaluation-form">
        <!-- Performance Evaluation -->
        <div
          v-for="(criteria, criteriaIndex) in listCriteria"
          :key="criteria.id"
          class="section mb-4"
        >
          <div class="d-flex justify-content-between">
            <label class="d-flex gap-2">
              <h5>{{ criteria.title }}</h5>
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
            <div
              v-for="(question, questionIndex) in criteria.questions"
              :key="question.id"
              class="question mb-3"
            >
              <div
                class="d-flex justify-content-between title"
                v-if="question.title"
              >
                <label>
                  {{ questionIndex + 1 }}. {{ question.title }}
                  <span class="text-danger"> *</span>
                </label>
              </div>

              <div v-if="question.answers" class="options d-flex justify-content-around my-3">
                <div v-for="(answer, answerIndex) in question.answers" :key="answer.id" class="form-check">
                  <input v-if="isAssess" type="radio" :id="'performanceOption' +
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
                      " :value="answer.value" :checked="checkValue(question.id, answer.value)"
                    :disabled="!checkValue(question.id, answer.value) && isSubmitted" />
                  <input v-else type="radio" :id="'performanceOption' +
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
                    " class="form-check-label">
                    {{ answer.title }}
                  </label>
                </div>
              </div>
              <!-- <div
                v-if="isAssess && personalAssessDetails?.find(detail => detail.criteria.id === criteria.id)?.description">
                <div class="description">
                  <textarea class="form-control" :class="{
                    'error-textarea': perfValues.assessDetails?.find(
                      (detail) => detail.criteriaId === criteria.id
                    )?.hasError,
                  }" rows="5" :value="personalAssessDetails.find(
                    (detail) => detail.criteria.id === criteria.id
                  )?.description || ''" readonly></textarea>
                </div>
              </div> -->
              <div v-if="isAssess" class="description">
                <textarea v-if="
                  isShowDescription(criteria.id, question.id)
                " class="form-control" :class="{
                  'error-textarea': perfValues.assessDetails?.find(
                    (detail) => detail.criteriaId === criteria.id
                  )?.hasError,
                }" rows="2" :readonly="isSubmitted" v-model="perfValues.assessDetails.find(
                    (detail) =>
                      detail.criteriaId === criteria.id &&
                      detail.questionId === question.id
                  ).description">
                </textarea>
              </div>

              <div v-else class="description">
                <textarea
                  v-if="isShowDescription(criteria.id, question.id)"
                  class="form-control"
                  :class="{
                    'error-textarea': perfValues.assessDetails.find(
                      (detail) =>
                        detail.criteriaId === criteria.id &&
                        detail.questionId === question.id
                    ).hasError,
                  }"
                  rows="2"
                  placeholder="Nhận xét thêm"
                  v-model="
                    perfValues.assessDetails.find(
                      (detail) =>
                        detail.criteriaId === criteria.id &&
                        detail.questionId === question.id
                    ).description
                  "
                  :ref="'description_' + criteria.id + '_' + question.id"
                ></textarea>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="form-group">
              <textarea v-if="!isAssess" class="form-control" :class="{
                'error-textarea': perfValues.assessDetails?.find(
                  (detail) => detail.criteriaId === criteria.id
                )?.hasError,
              }" rows="2" :value="perfValues.assessDetails?.find(
                (detail) => detail.criteriaId === criteria.id
              )?.description || ''
                " @input="updateDescription(criteria.id, $event.target.value)"
                placeholder="Nhập nội dung..."></textarea>
              <textarea v-else class="form-control" :class="{
                'error-textarea': perfValues.assessDetails?.find(
                  (detail) => detail.criteriaId === criteria.id
                )?.hasError,
              }" rows="2" :value="personalAssessDetails?.find(
                (detail) => detail.criteria.id === criteria.id
              )?.description || ''
                " :readonly="isSubmitted"></textarea>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="d-flex justify-content-end">
          <button class="btn btn-primary mr-1" :disabled="isAssess && isSubmitted"
            @click.prevent="submitFormWithConfirm">
            Gửi Đánh Giá
          </button>
          <button class="btn btn-secondary mr-1" :disabled="isAssess && isSubmitted" @click.prevent="submitForm">
            Lưu tạm đánh giá
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
<script>
import AssessService from "@/services/AssessService";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import profileImage from "@/assets/avata.png";

export default {
  name: "TeamMatesAssess",
  data() {
    return {
      isViewing: false,
      personalAssessDetails: [],
      isAssess: false,
      userInfo: null,
      listCriteria: [],
      selectedAnswers: {},
      perfValues: {},
      listScore: [],
      sortKey: "name",
      sortOrder: "asc",
      totalPoint: 0,
      departmentName: "",
      profileImage: profileImage,
      isSubmitted: false,
      listAssessDetails: [],
    };
  },
  async created() {
    const user = localStorage.getItem("user");
    if (user) {
      this.userInfo = JSON.parse(user);
    }
    await this.loadMyAssess().then(() => {
      if (this.isAssess) {
        const listCriteria = this.personalAssessDetails.map((detail) => detail.criteria);
        const uniqueCriteria = listCriteria.filter(
          (criteria, index, self) =>
            index ===
            self.findIndex(
              (t) => t.id === criteria.id && t.title === criteria.title
            )
        );
        this.listCriteria = uniqueCriteria;
        console.log("LIST CRITERIA:: ", this.listCriteria);
      } else {
        this.loadCriteria();
      }
    });
    this.loadDepartment();
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
  mounted() {
    window.onload = () => {
      localStorage.removeItem("assessDetails");
    };
  },
  methods: {
    async loadDepartment() {
      const user = JSON.parse(localStorage.getItem("user"));

      const departmentId = user.departmentId;
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
    checkValue(questionId, answerValue) {
      const detail = this.personalAssessDetails.find(
        (detail) => detail.question?.id === questionId
      );
      if (detail) {
        return detail.value === answerValue;
      }
      return false;
    },
    checkDesctiption(questionId) {
      const detail = this.personalAssessDetails.find(
        (detail) => detail.question.id === questionId
      );
      if (detail) {
        return detail.description;
      }
      return false;
    },
    async loadMyAssess() {
      const res = await AssessService.fetchMyAssess(this.userInfo.id);
      if (res && res.code === 1010) {
        console.log("PERSONAL ASSESS:: ", res.data);
        this.isAssess = true;
        this.isSubmitted = res.data.submitted;
        this.personalAssessDetails = res.data.assessDetails;
        this.perfValues.assessDetails = res.data.assessDetails.map((detail) => {
          return {
            criteriaId: detail.criteria?.id,
            questionId: detail.question?.id,
            value: detail?.value,
            description: detail?.description,
          };
        });
        console.log("PERSONAL ASSESS DETAILS:: ", this.personalAssessDetails);
      }
      if (res && res.code === 404) {
        this.isAssess = false;
        this.isSubmitted = false;
        console.error("Bạn chưa đánh giá cho bản thân");
      }
    },
    getAssessDetailValue(questionId) {
      const detail = this.personalAssess.assessDetails.find(
        (detail) => detail.questionId === questionId
      );
      return detail ? detail.value : null;
    },
    setAssessDetailValue(questionId, value) {
      const detail = this.personalAssess.assessDetails.find(
        (detail) => detail.questionId === questionId
      );
      if (detail) {
        detail.value = value;
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
    async loadCriteria() {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const departmentId = user.departmentId;
        const res = await AssessService.fetchListData(departmentId);
        if (res.code === 20403) {
          this.listCriteria = res.data.criteria;
        }

        // bỏ các tiêu chí của riêng team và manager ra khỏi list
        this.listCriteria = this.listCriteria
          .filter((c) => c.visibleFor !== "CROSS" && c.visibleFor !== "MANAGER")
          .sort((c1, c2) => {
            if (
              (c1.questions === undefined || c1.questions.length === 0) &&
              !(c2.questions === undefined || c2.questions.length === 0)
            ) {
              return 1;
            } else if (
              !(c1.questions === undefined || c1.questions.length === 0) &&
              (c2.questions === undefined || c2.questions.length === 0)
            ) {
              return -1;
            } else {
              return c1.id - c2.id;
            }
          });
      } catch (error) {
        console.error("Error fetching criteria list:", error);
      }
    },

    async submitForm() {
      if (!this.perfValues.assessDetails) {
        toast.error("Vui lòng điền đánh giá của bạn!", { autoClose: 3000 });
        return;
      }
      let allDescriptionsFilled = true;
      let allValuesSelected = true;
      let firstErrorRef = null;

      this.perfValues.assessDetails.forEach((detail) => {
        // check những criteria có câu hỏi. nếu có thì phải chọn giá trị
        const isCriteriaHasQuestion = (detail.questionId !== null && detail.questionId !== undefined);
        if (isCriteriaHasQuestion) {
          // Kiểm tra xem giá trị đã được chọn hay chưa
          if (!detail.value || detail.value === 0) {
            allValuesSelected = false;
            detail.hasError = true;
          }
          // Nếu giá trị >= 4, kiểm tra mô tả
          if (detail.value >= 4) {
            const isDescriptionFilled = detail.description && detail.description.trim() !== "";
            if (!isDescriptionFilled) {
              allDescriptionsFilled = false;
              detail.hasError = true;
              if (!firstErrorRef) {
                const refKey = `description_${detail.criteriaId}_${detail.questionId}`;
                firstErrorRef = this.$refs[refKey]?.[0];
              }
            } else {
              detail.hasError = false;
            }
          } else {
            detail.hasError = false;
          }
        } else { // nếu không có câu hỏi thì check mô tả có bị rỗng không, nếu rỗng thì báo lỗi
          if (!detail.description || detail.description.trim() === "") {
            allDescriptionsFilled = false;
            detail.hasError = true;
            if (!firstErrorRef) {
              const refKey = `description_${detail.criteriaId}_${detail.questionId}`;
              firstErrorRef = this.$refs[refKey]?.[0];
            }
          } else {
            detail.hasError = false;
          }
        }
      });

      // Kiểm tra và hiển thị thông báo lỗi
      if (!allValuesSelected) {
        toast.error("Vui lòng chọn giá trị cho tất cả các câu hỏi!", {
          autoClose: 2000,
        });
        return;
      }

      if (!allDescriptionsFilled) {
        toast.error("Vui lòng nhập nhận xét đầy đủ cho các câu hỏi!", {
          autoClose: 2000,
        });
        if (firstErrorRef) {
          firstErrorRef.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      this.isAssess = true;
      // Nếu tất cả hasError đều false thì xóa field hasError
      this.perfValues.assessDetails.forEach((detail) => {
        if (!detail.hasError) {
          delete detail.hasError;
        }
      });
      console.log(this.perfValues);
      // Thử gửi dữ liệu
      try {
        await AssessService.submitForm(
          this.userInfo.id,
          this.userInfo.id,
          this.totalPoint,
          this.perfValues,
          this.isSubmitted,
        );
        toast.success("Đánh giá thành công!", {
          autoClose: 2000,
        });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    },

    submitFormWithConfirm() {
      this.isSubmitted = true;
      this.submitForm();
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
      // console.log("criteriaId: %s, questionId: %s", criteriaId, questionId);
      // Kiểm tra xem assessDetails có tồn tại và lấy câu hỏi tương ứng
      const question = this.perfValues.assessDetails?.find(
        (detail) =>
          detail.criteriaId === criteriaId && detail.questionId === questionId
      );

      // Kiểm tra điều kiện để hiển thị mô tả
      return question && question.value >= 4;
    },
    selectPerformanceValue(
      criteriaId,
      criteriaIndex,
      questionId,
      questionIndex,
      value
    ) {
      console.log("criteriaId: %s, criteriaIndex: %s, questionId: %s, questionIndex: %s, value: %s", criteriaId, criteriaIndex, questionId, questionIndex, value);
      // Giả sử bạn đã khởi tạo perfValues.assessDetails trước đó
      if (!this.perfValues.assessDetails) {
        this.initPerfValues();
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
        if (value < 4) {
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

.content > p {
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
