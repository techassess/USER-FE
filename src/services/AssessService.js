import axios from "axios";
import { InfoUrl } from "../until/InfoUrl";
const AssessService = {
    fetchMyAssess: async (userId) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await axios.get(`${InfoUrl}/api/assess/${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            localStorage.setItem("myAssess", JSON.stringify(response.data.data));
            return response.data;
        } catch (error) {
            console.error("Error fetching myAssess:", error);
        }
    },
    submitForm: async (userId, toUserId, totalPoint, data, isSubmitted) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await axios.post(`${InfoUrl}/api/assess/save-assess`, {
                userId: userId,
                toUserId: toUserId,
                totalPoint: totalPoint,
                assessDetails: data.assessDetails,
                submitted: isSubmitted,
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Lỗi khi gửi yêu cầu:", error);
        }
    },
    fetchListData: async(departmentId) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await axios.get(`${InfoUrl}/api/departments/${departmentId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            localStorage.setItem("listData", JSON.stringify(response.data.data));
            return response.data;
        } catch (error) {
            console.error("Error fetching listData:", error);
        }
    },
    fetchAssessOfUser: async (userId) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await axios.get(`${InfoUrl}/api/assess/list-assess-of-user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            localStorage.setItem("assess-of-user" + userId, JSON.stringify(response.data.data));
            return response.data;
        } catch (error) {
            console.error("Error fetching assessSelf:", error);
        }
    },
    fetchAssessByUser: async (userId) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await axios.get(`${InfoUrl}/api/assess/list-assess-by-user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            localStorage.setItem("assess-by-user" + userId, JSON.stringify(response.data.data));
            return response.data;
        } catch (error) {
            console.error("Error fetching assessByUser:", error);
        }
    },
    fetchTypeAssessByUserId: async (userId) => {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await axios.get(`${InfoUrl}/api/assess/list-assess-of-user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log(response.data.data);
            localStorage.setItem("manager-assessment", JSON.stringify(response.data.data.filter(assess => assess.assessmentType === "MANAGER")));
            localStorage.setItem("self-assessment", JSON.stringify(response.data.data.filter(assess => assess.assessmentType === "SELF")));
            localStorage.setItem("team-assessment", JSON.stringify(response.data.data.filter(assess => assess.assessmentType === "TEAM")));
        } catch (error) {
            console.error("Error fetching typeAssessByUser:", error);
        }
    }
}

export default AssessService;