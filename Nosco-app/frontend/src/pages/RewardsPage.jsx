// src/pages/RewardsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { rewardService } from '../services/rewardService';
import RewardPointsDisplay from '../components/rewards/RewardPointsDisplay';
import RewardRankingTable from '../components/rewards/RewardRankingTable';
import RewardHistoryTable from '../components/rewards/RewardHistoryTable';
import RewardPointsChart from '../components/rewards/RewardPointsChart';


const RewardsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchRewardData = async () => {
      try {
        setError(null);
        const [points, rankingData, historyData] = await Promise.all([
          rewardService.getUserPoints(user.uid),
          rewardService.getRankings(),
          rewardService.getPointsHistory(user.uid)
        ]);
        
        setUserPoints(points);
        setRankings(rankingData);
        setHistory(historyData);
      } catch (err) {
        console.error('Error fetching reward data:', err);
        setError('Failed to load reward data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRewardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <RewardPointsDisplay points={userPoints} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Points Over Time</h2>
          </div>
          <div className="p-4">
            <RewardPointsChart history={history} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Top Rankings</h2>
          </div>
          <div className="p-4">
            <RewardRankingTable rankings={rankings} />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Reward History</h2>
        </div>
        <div className="p-4">
          <RewardHistoryTable history={history} />
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;