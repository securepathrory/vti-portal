import axios from 'axios';

const API_URL = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const login = async (username: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  return response.data.token;
};

export const register = async (username: string, password: string) => {
  const response = await axios.post(`${API_URL}/register`, { username, password });
  return response.data;
};

export const requestPasswordReset = async (username: string) => {
  const response = await axios.post(`${API_URL}/password-reset/request`, { username });
  return response.data.message;
};

export const confirmPasswordReset = async (token: string, newPassword: string) => {
  const response = await axios.post(`${API_URL}/password-reset/confirm`, { token, newPassword });
  return response.data;
};

export const getAdminData = async () => {
  const response = await axios.get(`${API_URL}/admin`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const getUserData = async () => {
  const response = await axios.get(`${API_URL}/user`, {
    headers: getAuthHeader(),
  });
  return response.data;
};