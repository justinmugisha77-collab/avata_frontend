import React from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';

const CustomerReviewsView = ({ reviews = [], darkMode = false, onRefresh }) => {
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-100 text-gray-900';
  const itemClass = darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-extrabold tracking-tight flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <MessageSquare className="text-indigo-600 w-8 h-8" />
            Customer Reviews
          </h2>
          <p className="text-gray-500 font-medium">See all recent product reviews from customers.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-2 rounded-full bg-indigo-100 text-indigo-700">
            {reviews.length} total
          </span>
          {typeof onRefresh === 'function' && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className={`${cardClass} rounded-2xl border p-6 shadow-sm`}>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className={`${itemClass} border rounded-xl p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {review.userName} • {review.productName}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {review.userEmail || 'No email provided'}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(review.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-amber-500">
                    {'★'.repeat(Math.max(0, Number(review.rating || 0)))}
                    {'☆'.repeat(Math.max(0, 5 - Number(review.rating || 0)))}
                  </div>
                </div>
                <p className={`text-sm mt-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviewsView;