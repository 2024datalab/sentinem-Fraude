import axios from 'axios';

const api = axios.create({
    baseURL: 'https://sentinelle-fraude-backend.onrender.com',
});

export default api;
