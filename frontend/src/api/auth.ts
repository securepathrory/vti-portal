import axios from 'axios';

const API_URL = '/api'; // Relative path since backend serves frontend

export const login = async (username: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  return response.data.token;
};

export const getAdminData = async (token: string) => {
  const response = await axios.get(`${API_URL}/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserData = async (token: string) => {
  const response = await axios.get(`${API_URL}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
