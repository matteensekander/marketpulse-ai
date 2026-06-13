import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const fetchStock = (ticker) => api.get(`/stock/${ticker}`).then(r => r.data);
export const fetchChart = (ticker, period) => api.get(`/stock/chart/${ticker}/${period}`).then(r => r.data);
export const fetchIndicators = (ticker) => api.get(`/stock/indicators/${ticker}`).then(r => r.data);
export const fetchStockTwits = (ticker) => api.get(`/stocktwits/${ticker}`).then(r => r.data);
export const fetchTrending = () => api.get('/stocktwits/market/trending').then(r => r.data);
export const fetchNews = (ticker) => api.get(`/news/${ticker}`).then(r => r.data);
export const fetchPrediction = (ticker) => api.get(`/prediction/${ticker}`).then(r => r.data);
export const fetchMovers = () => api.get('/stock/market/movers').then(r => r.data);
