import React from 'react';
import FeedbackItem from './FeedbackItem';

const FeedbackHistory = ({ feedbackList }) => {
  if (!feedbackList?.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Feedback History</h2>
        <p className="text-center text-gray-500 py-4">
          No feedback submitted yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Feedback History</h2>
      <div className="space-y-4">
        {feedbackList.map((feedback) => (
          <FeedbackItem key={feedback.id} feedback={feedback} />
        ))}
      </div>
    </div>
  );
};

export default FeedbackHistory;