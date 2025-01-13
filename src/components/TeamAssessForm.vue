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
                " class="form-check-label">{{ answer.title }}
              </label>
              <!-- Thêm  -->

              <div v-if="
                userInfo.userRoles.some(
                  (usRole) => usRole.role.name === 'MANAGER'
                )
              " class="avatar-group mt-2 d-flex justify-content-center">
                <div style="position: relative; margin-right: 10px" class="avatar-container" v-for="(user, userIndex) in isShowAvatar(
                  criteria.id,
                  question.id,
                  answer.value
                )" :key="userIndex">
                  <img :src="user.avt" alt="Avatar" class="avatar-img" :class="{
                    'highlight-blue': user.id === userInfo.id,
                    'highlight-yellow': user.id === selectedPerson.id,
                  }" style="cursor: pointer; border-radius: 50%" />
                  <span class="tooltiptext">
                    <div class="d-flex flex-column text-start">
                      <span class="fw-bold text-center">{{ user.name }}</span>
                      <span>{{
                        user.description ? user.description : ""
                      }}</span>
                    </div>
                  </span>
                </div>
              </div>
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
        <div v-if="userInfo.userRoles.some((usRole) => usRole.role.name === 'MANAGER')" class="spandes text-start">
          <span v-for="(answer, index) in result.criterias.find(
            (rc) => rc.id == criteria.id
          )?.answerUser || []" :key="index">

            {{
              answer.fromUserName
                ? answer.fromUserName + ": " + answer.description
                : " "
            }}<br />
          </span>
        </div>
        <div>
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
    </div>
    <div class="d-flex justify-content-end">
      <button :disabled="isLoading" class="btn btn-primary" type="submit">
        Gửi Đánh Giá
      </button>
    </div>
  </form>
</template>

<script>
import EVisibleFor from "@/enum/EVisibleFor";
import AssessService from "@/services/AssessService";
import UserService from "@/services/UserService";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
export default {
  name: "TeamAssessForm",
  props: {
    selectedPerson: Object,
  },
  emits: ["updateSelectedPerson"],
  data() {
    return {
      listAssess: [],
      assessDetail: {},
      result: {
        toUserId: null,
        criterias: [],
      },
      selfAssessDetails: [],

      userInfo: null,
      listCriteria: [],
      perfValues: {},
      listScore: [],
      sortKey: "name",
      sortOrder: "asc",
      totalPoint: 0,
      userRole: "manager",
      isLoading: false,
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
    perfValues: {
      handler() {
        localStorage.setItem("assessDetails", JSON.stringify(this.perfValues));
      },
      deep: true,
    },
    "selectedPerson.userProjects.0.id": {
      handler(newValue) {
        if (newValue) {
          this.loadCriteria();
        }
      },
      immediate: true,
    },
    selectedPerson: {
      immediate: true,
      handler() {
        if (this.selectedPerson) {
          this.result = {
            toUserId: null,
            criterias: [],
          };
          this.updateDepartmentId();
          this.fetchAssessOfUserId(this.selectedPerson.id);
        }
      },
    },
  },
  methods: {
    async updateDepartmentId() {
      if (this.selectedPerson && this.selectedPerson.departmentId) {
        localStorage.setItem(
          "userDepartmentId",
          JSON.stringify(this.selectedPerson.departmentId)
        );
        await this.loadCriteria(); // Gọi lại API với departmentId mới
      }
    },
    async loadCriteria() {
      try {
        const departmentId = JSON.parse(
          localStorage.getItem("userDepartmentId")
        );

        const res = await AssessService.fetchListData(departmentId);
        if (res.code === 20403) {
          this.listCriteria = res.data.criteria;
        }

        // hien thi danh sach tieu chi cho cac doi tunog cu the
        const currentUserInfo = JSON.parse(localStorage.getItem("user"));
        const currentUserPosition = currentUserInfo.rank.position.name;
        if (currentUserPosition !== "LEADER") {
          this.listCriteria = this.listCriteria
            .filter(
              (c) =>
                c.visibleFor !== EVisibleFor.SELF.key &&
                c.visibleFor !== EVisibleFor.MANAGER.key
            )
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
        } else {
          this.listCriteria = this.listCriteria.sort((c1, c2) => {
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
        }

        this.initPerfValues();
      } catch (error) {
        console.error("Error fetching criteria list:", error);
      }
    },
    initPerfValues() {
      this.perfValues.assessDetails = [];
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
      let userPosition = this.userInfo.rank.position.name;
      let userID = this.userInfo.id;

      if (userPosition === "LEADER") {
        try {
          const numberOfUserInTeam = await UserService.fetchTeamsByUserId(
            userID
          );

          const recordCheckRes = await AssessService.fetchAssessOfUser(
            this.selectedPerson.id
          );

          if (recordCheckRes.code === 1010) {
            const recordCount = recordCheckRes.data.length;

            if (recordCount !== numberOfUserInTeam.data.length) {
              toast.error(
                "Số lượng đánh giá của nhân viên chưa đủ. Vui lòng kiểm tra lại!"
              );
              return;
            }
          } else {
            toast.error(
              "Không thể kiểm tra số lượng bản ghi. Vui lòng thử lại!"
            );
            return;
          }
        } catch (error) {
          toast.error("Lỗi khi kiểm tra số lượng bản ghi!");
          console.error("Error checking record count:", error);
          return;
        }
      }
      this.perfValues.assessDetails.forEach((detail) => {
        const isCriteriaToCheck = detail.questionId !== null;
        if (isCriteriaToCheck && (!detail.value || detail.value === 0)) {
          allValuesSelected = false;
        }

        if (detail.value >= 4 && isCriteriaToCheck) {
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
        } else {
          detail.hasError = false;
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

      this.isLoading = true;
      this.perfValues.assessDetails.forEach((detail) => {
        if (!detail.hasError) {
          delete detail.hasError;
        }
      });

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
        } else {
          toast.error("Đánh giá thất bại. Vui lòng quay lại sau!");
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
      return question && question.value >= 4;
    },
    selectPerformanceValue(
      criteriaId,
      criteriaIndex,
      questionId,
      questionIndex,
      value
    ) {
      if (!this.perfValues.assessDetails) {
        this.perfValues.assessDetails = [];

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

      const assessDetail = this.perfValues.assessDetails.find(
        (detail) =>
          detail.criteriaId === criteriaId && detail.questionId === questionId
      );

      if (assessDetail) {
        assessDetail.value = value;

        if (value < 4) {
          assessDetail.description = null; // Hoặc "" tùy thuộc vào yêu cầu
        }
      }

      if (!this.listScore[criteriaIndex]) {
        this.listScore[criteriaIndex] = {};
      }

      const newScore = this.calculateScoreSelected(
        criteriaIndex,
        questionIndex,
        value
      );

      this.listScore[criteriaIndex][questionIndex] = newScore;

      const questionsCount =
        this.listCriteria[criteriaIndex]?.questions?.length || 0;
      const answeredQuestionsCount = Object.keys(
        this.listScore[criteriaIndex]
      ).filter((key) => key !== "totalOfCriteria").length;

      if (answeredQuestionsCount === questionsCount) {
        const totalOfCriteria = this.calculateTotalOfCriteria(criteriaIndex);
        const percentage = Math.round(
          ((totalOfCriteria * 20) / 100) *
          (this.listCriteria[criteriaIndex]?.point || 1)
        );

        this.listScore[criteriaIndex].totalOfCriteria = percentage;
      }

      this.updateTotalPoint();

      localStorage.setItem("assessDetails", JSON.stringify(this.perfValues));
    },
    calculateScoreSelected(criteriaIndex, questionIndex, value) {
      const question =
        this.listCriteria[criteriaIndex]?.questions[questionIndex];
      const pointCriteria =
        parseFloat(this.listCriteria[criteriaIndex]?.point) || 1; // Điểm tiêu chí
      const questionScore = parseFloat(question?.point) || 0; // Điểm của câu hỏi
      const selectedValue = parseFloat(value) || 0; // Giá trị được chọn

      const score = (questionScore / pointCriteria) * selectedValue;

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

    // Thêm
    isShowAvatar(criteriaId, questionId, answerValue) {
      const criteria = this.result.criterias.find((c) => c.id === criteriaId);
      if (!criteria) {
        return [];
      }

      const question = criteria.questions.find((q) => q.id === questionId);
      if (!question) {
        return []; // Nếu không tìm thấy câu hỏi, trả về mảng rỗng
      }

      const answer = question.answerUsers.find((a) => a.value === answerValue);
      if (!answer) {
        return []; // Nếu không tìm thấy câu trả lời, trả về mảng rỗng
      }

      // Trả về danh sách fromUsers (hoặc trường `name` nếu tồn tại)
      const users = answer.fromUsers.map((user) => {
        if (!user.avt) user.avt = "/images/avatar.png";
        return user;
      });

      return users;
    },
    async fetchAssessOfUserId(userId) {
      try {
        const response = await AssessService.fetchAssessOfUser(userId);
        this.listAssess = response.data;

        this.selfAssessDetails = response.data.filter(
          (assess) => assess.assessmentType === "SELF"
        );

        // Convert data -> assessDetail
        if (this.listAssess.length == 0) return;

        this.listAssess.forEach(async (assess) => {
          this.result.toUserId = assess.toUserId;
          const res = await UserService.fetchUserById(assess.userId);
          if (res.code === 1010) {
            const user = res.data;
            assess.assessDetails.forEach((assessDetail) => {
              // Kiểm tra `criteria` có tồn tại trước khi truy cập `id`
              if (assessDetail.criteria && assessDetail.criteria.id != null) {
                let resultCriteria = this.result.criterias.find(
                  (criteria) => criteria.id === assessDetail.criteria.id
                );

                // Nếu không tồn tại, thêm tiêu chí mới vào
                if (!resultCriteria) {
                  resultCriteria = {
                    id: assessDetail.criteria.id,
                    title: assessDetail.criteria.title,
                    questions: [],
                    answerUser: null, // Khởi tạo answerUser là null
                  };
                  this.result.criterias.push(resultCriteria);
                }

                // Tìm xem câu hỏi đã tồn tại trong bất kỳ tiêu chí nào của `criterias` không
                const questionExists = this.result.criterias.some((criteria) =>
                  criteria.questions.some(
                    (question) => question.id === assessDetail.question?.id
                  )
                );

                // Nếu câu hỏi chưa tồn tại và assessDetail.question hợp lệ, thêm vào
                if (
                  !questionExists &&
                  assessDetail.question &&
                  assessDetail.question.id != null
                ) {
                  const resultQuestion = {
                    id: assessDetail.question.id,
                    title: assessDetail.question.title,
                    answers: [...assessDetail.question.answers],
                    answerUsers: [], // Khởi tạo answerUsers là mảng rỗng
                  };
                  resultCriteria.questions.push(resultQuestion);
                }

                if (
                  assessDetail.question &&
                  assessDetail.value != null &&
                  user
                ) {
                  const resultQuestion = resultCriteria.questions.find(
                    (question) => question.id === assessDetail.question.id
                  );

                  if (resultQuestion) {
                    const answer = assessDetail.question.answers.find(
                      (ans) => ans.value === assessDetail.value
                    );

                    if (answer) {
                      const existingAnswerUser =
                        resultQuestion.answerUsers.find(
                          (u) => u.id === answer.id
                        );

                      if (existingAnswerUser) {
                        // Nếu user đã tồn tại trong câu trả lời, thêm vào mảng fromUsers
                        existingAnswerUser.fromUsers.push({
                          id: user.id,
                          avt: user.fileInfo
                            ? user.fileInfo.fileUrl
                            : "/images/avatar.png",
                          name: user.name,
                          description: assessDetail.description,
                        });
                      } else {
                        // Nếu chưa tồn tại, thêm user mới vào answerUsers
                        resultQuestion.answerUsers.push({
                          id: answer.id,
                          label: answer.title,
                          value: answer.value,
                          fromUsers: [
                            {
                              id: user.id,
                              avt: user.fileInfo
                                ? user.fileInfo.fileUrl
                                : "/images/avatar.png",
                              name: user.name,
                              description: assessDetail.description,
                            },
                          ],
                        });
                      }
                    }
                  }
                } else if (user) {
                  if (!resultCriteria.answerUser) {
                    resultCriteria.answerUser = [];
                  }

                  if (this.result.toUserId == user.id) {
                    resultCriteria.answerUser.push({
                      fromUserName: "",
                      avt: user.fileInfoResDto?.url
                        ? user.fileInfoResDTO.url
                        : "/images/avatar.png",
                      description: assessDetail.description,
                    });
                  } else {
                    resultCriteria.answerUser.push({
                      fromUserName: user.name,
                      avt: user.fileInfoResDto?.url
                        ? user.fileInfoResDTO.url
                        : "/images/avatar.png",
                      description: assessDetail.description,
                    });
                  }
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("Error fetching assess by userid:", error);
      }
    },
    async fetchCriterias() {
      try {
        const response = await AssessService.fetchListData();
        if (response.code === 1010) {
          this.criterias = JSON.parse(localStorage.getItem("listData"));
        }
      } catch (error) {
        console.error("Error fetching criterias:", error);
      }
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

/* Thêm  */
.highlight-blue {
  border: 2px solid blue;
  border-radius: 50%;
}

.highlight-yellow {
  border: 2px solid rgb(43, 255, 0);
  border-radius: 50%;
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
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
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
  display: block;
  width: 100%;
  overflow-x: auto;
  /* Cho phép cuộn ngang */
  -webkit-overflow-scrolling: touch;
}


.table > table {
  width: 100%;
  margin-bottom: 1rem;
  border-collapse: collapse;
}

/* Right Menu Styles */
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

/* Thêm  */
.highlight-blue {
  border: 2px solid blue;
  border-radius: 50%;
}

.highlight-yellow {
  border: 2px solid rgb(43, 255, 0);
  border-radius: 50%;
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
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
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
  display: block;
  width: 100%;
  overflow-x: auto;
  /* Cho phép cuộn ngang */
  -webkit-overflow-scrolling: touch;
}

.table>table {
  width: 100%;
  margin-bottom: 1rem;
  border-collapse: collapse;
}

/* Right Menu Styles */
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

/* Tooltip container */
.avatar-group {
  position: relative;
  display: inline-block;
}

/* Tooltip text */
.tooltiptext {
  visibility: hidden;
  width: 180px;
  background-color: #ffffff;
  color: black;
  text-align: center;
  border-radius: 5px;
  padding: 10px;
  position: absolute;
  z-index: 1;
  top: 125%;
  /* Vị trí tooltip */
  left: 50%;
  margin-left: -85px;
  opacity: 0;
  transition: opacity 0.3s;
  border: 1px solid dodgerblue;
}

.avatar-container:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}

.avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.answer-label {
  background-color: rgba(51, 51, 51, 0.05);
  border-radius: 8px;
  border-width: 0;
  color: #333333;
  display: inline-block;
  font-family: "Haas Grot Text R Web", "Helvetica Neue", Helvetica, Arial,
    sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  list-style: none;
  margin: 0;
  padding: 10px 12px;
  text-align: center;
  transition: all 200ms;
  vertical-align: baseline;
  white-space: nowrap;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  max-width: 250px;
  /* Đặt chiều rộng tối đa của label */
  white-space: normal;
  /* Cho phép text xuống dòng */
  overflow-wrap: break-word;
  /* Ngắt từ để text không bị tràn ra ngoài */
  display: inline-block;
  /* Cho phép label có kích thước chiều rộng cụ thể */
}

/* Container cho dropdowns */
.dropdowns {
  display: flex;
  /* Sử dụng Flexbox để sắp xếp các dropdown nằm cùng hàng */
  flex-wrap: nowrap;
  /* Ngăn không cho các dropdown xuống hàng */
  gap: 20px;
  /* Khoảng cách giữa các dropdown */
  align-items: center;
  /* Căn giữa các dropdown theo chiều dọc */
  margin-bottom: 20px;
  /* Khoảng cách dưới của container */
}

/* Style cho mỗi dropdown */
.form-select {
  width: 150px;
  /* Đặt chiều rộng cho dropdown */
  height: 40px;
  /* Thay đổi chiều cao của dropdown */
  padding: 0.375rem 0.75rem;
  /* Padding cho dropdown */
  font-size: 1rem;
  /* Kích thước font chữ */
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  /* Màu nền của dropdown */
  background-clip: padding-box;
  border: 1px solid #ced4da;
  /* Viền của dropdown */
  border-radius: 0.25rem;
  /* Bo góc của dropdown */
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  /* Hiệu ứng chuyển tiếp */
}

.form-select:focus {
  border-color: #007bff;
  /* Màu viền khi focus */
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(38, 143, 255, 0.25);
  /* Hiệu ứng bóng đổ khi focus */
}

/* Style cho label của dropdown */
.form-label {
  display: block;
  margin-bottom: 0.5rem;
  /* Khoảng cách dưới của label */
  font-weight: 600;
  /* Định dạng font chữ của label */
  color: #333;
  /* Màu chữ của label */
}

/* Đối với màn hình nhỏ (điện thoại di động) */
@media (max-width: 576px) {
  .container-fluid {
    padding-top: 50px;
    padding-bottom: 50px;
  }

  .left-menu,
  .right-menu {
    margin-left: 0;
    margin-right: 0;
    margin-top: 15px;
    height: auto;
    /* Chiều cao tự động để tránh bị cắt xén */
  }

  .profile {
    max-width: 100%;
    margin: 0 auto;
  }

  .evaluation-form {
    padding: 10px;
  }

  .form-select {
    width: 100%;
    /* Chiếm toàn bộ chiều rộng trên màn hình nhỏ */
  }

  .form-buttons {
    flex-direction: column;
    /* Các nút nằm theo chiều dọc */
    gap: 10px;
  }
}

/* Đối với màn hình trung bình (máy tính bảng) */
@media (min-width: 576px) and (max-width: 768px) {

  .left-menu,
  .right-menu {
    height: auto;
    margin-left: 0;
    margin-right: 0;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }

  .avatar-img {
    width: 20px;
    height: 20px;
  }

  .evaluation-header {
    font-size: 16px;
  }

  .form-select {
    width: 100%;
    /* Đặt chiều rộng toàn bộ */
  }
}

/* Đối với màn hình lớn (máy tính để bàn) */
@media (min-width: 992px) {
  .profile {
    max-width: 400px;
    margin: 0 auto;
  }

  .avatar {
    width: 100px;
    height: 100px;
  }

  .avatar-img {
    width: 30px;
    height: 30px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-display {
  color: red;
  text-align: right;
}

.spandes {
  background-color: #d8d8d8;
  border-radius: 5px;
  padding: 10px;
}
</style>
