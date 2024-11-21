import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFeedbackHistory } from '../services/feedbackService';
import FeedbackForm from '../components/feedback/FeedbackForm';
import FeedbackHistory from '../components/feedback/FeedbackHistory';

const FeedbackPage = () => {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFeedbackHistory = async () => {
    try {
      const history = await getFeedbackHistory(user.uid);
      setFeedbackList(history);
    } catch (error) {
      console.error('Error loading feedback history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbackHistory();
  }, [user.uid]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <FeedbackForm onFeedbackSubmitted={loadFeedbackHistory} />
      
      {isLoading ? (
        <div className="text-center py-4">Loading feedback history...</div>
      ) : (
        <FeedbackHistory feedbackList={feedbackList} />
      )}
    </div>
  );
};

export default FeedbackPage;