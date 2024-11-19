import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const PaymentCommentSection = ({ comments = [], onCommentAdd }) => {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    onCommentAdd(newComment);
    setNewComment('');
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date?.toDate?.() 
      ? date.toDate().toLocaleString()
      : new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comments</h3>
      
      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg">
            <p className="text-gray-900">{comment.text}</p>
            <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
              <span>
                {comment.userID === user?.uid ? 'You' : 'Admin'}
              </span>
              <span>{formatDate(comment.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="mt-4">
        <textarea
          className="w-full p-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add a comment..."
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Add Comment
        </button>
      </form>
    </div>
  );
};

export default PaymentCommentSection;