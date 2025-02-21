import request from '@/utils/request';

const AuthService = {
    // Hàm đăng nhập
    login: async (username, password) => {
        try {
            const response = await request.post(`/api/auths/login`, {
                username: username,
                password: password,
            });
            localStorage.setItem("accessToken", response.data.data);
            return response.data;
        } catch (error) {
            if (error.response) {
                return error.response.data; // Trả về lỗi từ máy chủ
            } else {
                return { message: "Lỗi kết nối đến máy chủ" }; // Lỗi khác không liên quan tới response từ server
            }
        }
    },
    // Hàm đăng ký tài khoản mới
    register: async (username, password) => {
        try {
            const response = await request.post(`/api/auths/register`, {
                username: username,
                password: password,
            });
            return response.data;
        } catch (error) {
            if (error.response) {
                return error.response.data; // Trả về lỗi từ máy chủ
            } else {
                return { message: "Lỗi kết nối đến máy chủ" };
            }
        }
    },

    // Hàm lấy thông tin người dùng hiện tại theo tên đăng nhập
    fetchUserByUserName: async (username) => {
        try {
            const response = await request.get(`/api/users/current-user/${username}`);
            return response.data;
        } catch (error) {
            if (error.response) {
                return error.response.data;
            } else {
                return { message: "Lỗi kết nối đến máy chủ" };
            }
        }
    },
    isLogin: () => {
        const accessToken = localStorage.getItem("accessToken");
        return !!accessToken;
    },
    fecthUserById: async (id)=>{
        try {
            const response = await request.get(`/api/users/${id}`);
            return response.data;
        } catch (error) {
            if (error.response) {
                return error.response.data;
            } else {
                return { message: "Lỗi kết nối đến máy chủ" };
            }
        }
    }
};

export default AuthService;
