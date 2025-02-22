import request from "@/utils/request";
const AssessService = {
  fetchMyAssess: async (userId) => {
    try {
      const response = await request.get(`/api/assess/${userId}`);
      localStorage.setItem("myAssess", JSON.stringify(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching myAssess:", error);
    }
  },
  submitForm: async (userId, toUserId, totalPoint, data) => {
    try {
      const response = await request.post(`/api/assess/save-assess`, {
        userId: userId,
        toUserId: toUserId,
        totalPoint: totalPoint,
        assessDetails: data.assessDetails,
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu:", error);
    }
  },
  fetchListData: async (departmentId) => {
    try {
      const response = await request.get(`/api/departments/${departmentId}`);
      localStorage.setItem("listData", JSON.stringify(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching listData:", error);
    }
  },
  fetchAssessOfUser: async (userId) => {
    try {
      const response = await request.get(`/api/assess/list-assess-of-user/${userId}`);
      localStorage.setItem("assess-of-user" + userId, JSON.stringify(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching assessSelf:", error);
    }
  },
  fetchAssessByUser: async (userId) => {
    try {
      const response = await request.get(`/api/assess/list-assess-by-user/${userId}`);
      localStorage.setItem("assess-by-user" + userId, JSON.stringify(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Error fetching assessByUser:", error);
    }
  },
  fetchTypeAssessByUserId: async (userId) => {
    try {
      const response = await request.get(`/api/assess/list-assess-of-user/${userId}`);
      localStorage.setItem(
        "manager-assessment",
        JSON.stringify(response.data.data.filter((assess) => assess.assessmentType === "MANAGER"))
      );
      localStorage.setItem(
        "self-assessment",
        JSON.stringify(response.data.data.filter((assess) => assess.assessmentType === "SELF"))
      );
      localStorage.setItem(
        "team-assessment",
        JSON.stringify(response.data.data.filter((assess) => assess.assessmentType === "TEAM"))
      );
    } catch (error) {
      console.error("Error fetching typeAssessByUser:", error);
    }
  },
};

export default AssessService;
