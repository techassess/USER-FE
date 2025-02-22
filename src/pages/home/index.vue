<template>
  <div class="background-container d-flex align-items-center">
    <div class="container">
      <div class="step-container">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step"
          :style="{ backgroundColor: step.color }"
          :class="{ active: isActiveStep(index) }"
        >
          <div class="step-title">{{ step.title }}</div>
          <div class="step-text">{{ step.text }}</div>
        </div>
      </div>

      <div class="title-container">
        <div class="title-box">
          <div
            v-for="(title, index) in titles"
            :key="index"
            class="title"
            :class="[title.class, { active: isActiveTitle(index) }]"
          >
            {{ title.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  name: "HomePage",
  data() {
    return {
      steps: [
        {
          title: "Training đánh giá",
          text: "Các nhân viên sẽ được training về cách đánh giá và đánh giá chéo cho các thành viên chung dự án.",
          color: "#87CEEB",
        },
        {
          title: "Đánh giá",
          text: "Các nhân viên sẽ đánh giá các thành viên trong team dự án",
          color: "#FFD700",
        },
        {
          title: "Xem kết quả",
          text: "Xem tổng điểm, số bậc đề xuất tăng của đánh giá quý này",
          color: "#FF6347",
        },
      ],
      titles: [
        { text: "21/09 - 30/09", class: "now" },
        { text: "01/10 - 15/10", class: "new" },
        { text: "16/10 - 20/10", class: "after" },
      ],
      currentDate: new Date(), // Cập nhật giá trị này tùy thuộc vào nhu cầu
    };
  },
  methods: {
    isActiveTitle(index) {
      // Logic để xác định tiêu đề nào là hiện tại
      const titleDates = [
        { start: new Date("2024-09-21"), end: new Date("2024-09-30") },
        { start: new Date("2024-10-01"), end: new Date("2024-10-10") },
        { start: new Date("2024-10-11"), end: new Date("2024-10-20") },
      ];

      // Chuyển đổi ngày hiện tại thành chỉ phần ngày (00:00:00)
      const currentDate = new Date(this.currentDate.toDateString());

      // Lấy start và end của tiêu đề tương ứng và cũng chuyển về phần ngày
      const { start, end } = titleDates[index];
      const startDate = new Date(start.toDateString());
      const endDate = new Date(end.toDateString());

      return currentDate >= startDate && currentDate <= endDate;
    },
    isActiveStep(index) {
      return this.isActiveTitle(index); // Bước và tiêu đề đồng bộ
    },
  },
};
</script>
<style scoped>
.background-container {
  background-color: #4e7fcf;
  min-height: 100vh;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 700px;
  background-color: #f7f7f7;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 6px 6px 8px 8px rgba(0, 0, 0, 0.2);
  background-color: #fff;
  margin-top: -17px;
}

.step-container {
  display: flex;
  justify-content: space-around;
  width: 70%;
  margin-bottom: 20px;
}

.step {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  width: 200px;
  height: auto;
  margin-right: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s, background-color 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-wrap: break-word;
  white-space: normal;
  margin-bottom: 30px;
}

.step.active {
  transform: scale(1.1) translateY(-25px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  background-color: #3498db;
  color: #fff;
}

.step:last-child {
  margin-right: 0;
}

.step-title {
  font-size: 25px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  padding: 10px 20px;
}

.step-number {
  font-size: 48px;
  font-weight: bold;
  color: #3498db;
  margin-bottom: 12px;
}

.step-text {
  font-size: 16px;
  color: #666;
  word-wrap: break-word;
  white-space: normal;
  text-align: center;
  padding: 10px 20px;
}

.title-container {
  display: flex;
  justify-content: center;
  width: 70%;
}

.title-box {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
}

.title {
  background-color: #b3b5b5;
  /* Màu nền của tiêu đề để nổi bật hơn */
  color: #fff;
  border-radius: 0;
  /* Đặt border-radius bằng 0 để loại bỏ bo tròn */
  padding: 15px 20px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s, transform 0.3s;
  box-sizing: border-box;
  flex: 1;
  margin: 0 1px;
  text-transform: uppercase;
}

.title.before {
  border-radius: 10px 0 0 10px;
}

.title.now {
  border-radius: 0;
}

.title.after {
  border-radius: 0 10px 10px 0;
}

.title.active {
  background-color: #646666;
  color: #fff;
}

.title-box::before {
  content: "";
  display: block;
  height: 2px;
  width: 100%;
  background-color: #ccc;
  position: absolute;
  top: 50%;
  left: 0;
  z-index: -1;
}

.title-box::after {
  content: "";
  display: block;
  height: 2px;
  width: 100%;
  background-color: #ccc;
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: -1;
}

/* Adjust styles for smaller screens */
@media (max-width: 768px) {
  .step-container,
  .title-container {
    flex-direction: column;
    align-items: center;
  }

  .step,
  .title-box {
    width: 100%;
    margin-bottom: 20px;
  }

  .step:last-child,
  .title-box:last-child {
    margin-bottom: 0;
  }

  .title {
    width: 100%;
    margin-bottom: 10px;
  }

  .title-box::before,
  .title-box::after {
    display: none;
  }
}
</style>
