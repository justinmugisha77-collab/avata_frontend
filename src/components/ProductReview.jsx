import React, { useState, useEffect } from 'react';
import { User as UserIcon, ThumbsUp } from 'lucide-react';
import StarRating from './StarRating';
import { useAuth } from '../contexts/AuthContext';

const ProductReview = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    guestName: '',
    guestEmail: '',
    rating: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      // Try to fetch from backend
      const response = await fetch(`http://localhost:5000/api/products/${productId}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        throw new Error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Fallback to localStorage
      const localReviews = JSON.parse(localStorage.getItem(`reviews_${productId}`) || '[]');
      setReviews(localReviews);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (newReview.rating === 0) {
      alert('Please select a star rating');
      return;
    }

    if (!newReview.comment.trim()) {
      alert('Please write a review comment');
      return;
    }

    if (!isAuthenticated && !newReview.guestName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!isAuthenticated && !newReview.guestEmail.trim()) {
      alert('Please enter your email');
      return;
    }

    setLoading(true);

    const reviewData = {
      productId,
      userId: user?.id || null,
      userName: isAuthenticated ? user.full_name : newReview.guestName,
      userEmail: isAuthenticated ? user.email : newReview.guestEmail,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString(),
      helpful: 0
    };

    try {
      // Try to save to backend
      const response = await fetch(`http://localhost:5000/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const savedReview = await response.json();
      setReviews([savedReview, ...reviews]);
    } catch (error) {
      console.error('Error submitting review:', error);
      // Fallback to localStorage
      const localReviews = JSON.parse(localStorage.getItem(`reviews_${productId}`) || '[]');
      localReviews.unshift(reviewData);
      localStorage.setItem(`reviews_${productId}`, JSON.stringify(localReviews));
      setReviews(localReviews);
    } finally {
      setLoading(false);
      setNewReview({ guestName: '', guestEmail: '', rating: 0, comment: '' });
      setShowReviewForm(false);
      alert('Review submitted successfully!');
    }
  };

  const handleHelpful = async (reviewIndex) => {
    const updatedReviews = [...reviews];
    updatedReviews[reviewIndex].helpful = (updatedReviews[reviewIndex].helpful || 0) + 1;
    setReviews(updatedReviews);

    // Update in localStorage
    localStorage.setItem(`reviews_${productId}`, JSON.stringify(updatedReviews));
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-5 mt-5">
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-bold mb-3">Customer Reviews</h2>
        
        {reviews.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3 pb-3 border-b">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={Math.round(averageRating)} readonly size={16} />
              <div className="text-xs text-gray-600 mt-1">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>
            
            <div className="flex-grow">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter(r => r.rating === stars).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 mb-1">
                    <span className="text-xs w-11">{stars} star</span>
                    <div className="flex-grow bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-9 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!showReviewForm ? (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
          >
            Write a Review
          </button>
        ) : (
          <form onSubmit={handleSubmitReview} className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-sm sm:text-base mb-3">Write Your Review</h3>

              {!isAuthenticated && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      value={newReview.guestName}
                      onChange={(e) => setNewReview({ ...newReview, guestName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Your Email *</label>
                    <input
                      type="email"
                      value={newReview.guestEmail}
                      onChange={(e) => setNewReview({ ...newReview, guestEmail: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Your Rating *
                </label>
                <StarRating
                  rating={newReview.rating}
                  onRatingChange={(rating) => setNewReview({ ...newReview, rating })}
                  size={24}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share your experience with this product..."
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setNewReview({ guestName: '', guestEmail: '', rating: 0, comment: '' });
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
          </form>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-6">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review, index) => (
            <div key={index} className="border-b pb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserIcon size={16} className="text-blue-600" />
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{review.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <StarRating rating={review.rating} readonly size={14} />
                  
                  <p className="mt-1.5 text-sm text-gray-700">{review.comment}</p>
                  
                  <button
                    onClick={() => handleHelpful(index)}
                    className="mt-1.5 flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600"
                  >
                    <ThumbsUp size={14} />
                    Helpful ({review.helpful || 0})
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReview;
