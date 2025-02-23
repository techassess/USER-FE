import request from '@/utils/request';

const UserService = {
  fetchTeamsByUserId: async (userId) => {
    try {
      const response = await request.get(`/api/users/${userId}/same-project`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  },
  calculateWorkingTime: (startDate) => {
    const endDate = new Date();
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log(diffDays);
    return diffDays;
  },
  async uploadAvatar(user, formData) {
    try {
      // Gọi API PUT để upload avatar, sử dụng formData
      const response = await request.put(`/api/users/updateUserWithAvatar/${user.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",  // Đảm bảo gửi đúng Content-Type
        },
      });
      return response.data;
    } catch (error) {
      console.error(error);
      console.error(error);
    }
  },
  fetchUserById: async (userId) => {
    try {
      const response = await request.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
};

export default UserService;
