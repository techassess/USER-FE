import request from '@/utils/request';
const ProjectService = {
    fetchProjectById: async (projectId) => {
        try {
            const response = await request.get(`/api/projects/${projectId}`);
            return response.data;
        } catch (error) {
            console.log(error);
        }
    }
};
export default ProjectService;