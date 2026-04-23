import axios from 'axios';
import {API_URL} from "../../configs.ts";
import {useAuthState} from "./hook.ts";

const useAxios = () => {
  const {token} = useAuthState();

  const axiosInstance = axios.create({
    baseURL: API_URL,
  });

  axiosInstance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('authState');
        window.location.assign('/login');
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

export default useAxios;
