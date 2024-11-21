import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFeedbackHistory } from '../services/feedbackService';
import FeedbackForm from '../components/feedback/FeedbackForm';
import FeedbackHistory from '../components/feedback/FeedbackHistory';
import FeedbackSkeleton from '../components/feedback/FeedbackSkeleton';

const FeedbackPage = () => {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFeedbackHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await getFeedbackHistory(user.uid);
      setFeedbackList(history);
    } catch (error) {
      setError('Failed to load feedback history. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadFeedbackHistory();
    }
  }, [user?.uid]);

  const handleFeedbackSubmitted = async () => {
    setIsSubmitting(true);
    try {
      await loadFeedbackHistory();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    loadFeedbackHistory();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <FeedbackForm 
        onFeedbackSubmitted={handleFeedbackSubmitted} 
        isSubmitting={isSubmitting}
      />
      
      {isLoading ? (
        <FeedbackSkeleton />
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={handleRetry}
            className="text-blue-500 hover:text-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : (
        <FeedbackHistory feedbackList={feedbackList} />
      )}
    </div>
  );
};

export default FeedbackPage;