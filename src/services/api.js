import axios from 'axios';
import { mockRooms } from '../mockData/rooms';
import { mockLeaderboard } from '../mockData/leaderboard';
import { mockTimetable } from '../mockData/timetable';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.3.11:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const fetchRooms = async () => {
  try {
    const res = await api.get('/rooms');
    return res.data && Array.isArray(res.data) && res.data.length > 0 ? res.data : mockRooms;
  } catch (err) {
    console.error('Error fetching /rooms, falling back to mock data:', err);
    return mockRooms;
  }
};

export const fetchTimetable = async () => {
  try {
    const res = await api.get('/timetable');
    return res.data && Array.isArray(res.data) && res.data.length > 0 ? res.data : mockTimetable;
  } catch (err) {
    console.error('Error fetching /timetable, falling back to mock data:', err);
    return mockTimetable;
  }
};

export const fetchAlerts = async () => {
  try {
    const res = await api.get('/alerts?status=active');
    return res.data && Array.isArray(res.data) ? res.data : null;
  } catch (err) {
    console.error('Error fetching /alerts, falling back to mock data:', err);
    return null;
  }
};

export const fetchLeaderboard = async () => {
  try {
    const res = await api.get('/leaderboard');
    if (res.data && (res.data.top || res.data.bottom)) {
      return res.data;
    }
    return mockLeaderboard;
  } catch (err) {
    console.error('Error fetching /leaderboard, falling back to mock data:', err);
    return mockLeaderboard;
  }
};

export const fetchLedger = async () => {
  try {
    const res = await api.get('/ledger');
    return res.data ? res.data : { total_kwh_saved: 1248, total_inr_saved: 9984, total_co2_saved_kg: 1023 };
  } catch (err) {
    console.error('Error fetching /ledger, falling back to mock data:', err);
    return { total_kwh_saved: 1248, total_inr_saved: 9984, total_co2_saved_kg: 1023 };
  }
};

export const sendNLQuery = async (question) => {
  try {
    const res = await api.post('/nlquery', { question });
    return res.data;
  } catch (err) {
    console.error('Error sending /nlquery, falling back to mock response:', err);
    return {
      answer: "Room 305 wasted the most energy today, consuming 1,800 W while completely unoccupied for over 2 hours.",
      chart_data: null,
    };
  }
};
