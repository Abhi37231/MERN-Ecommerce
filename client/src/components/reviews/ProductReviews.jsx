import { useState } from 'react';
import { Star, Image as ImageIcon } from 'lucide-react';

const ProductReviews = ({ reviews, totalReviews }) => {
  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-deep py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-serif text-gray-900 dark:text-white">Customer Reviews</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Based on {totalReviews || reviews.length} review{totalReviews !== 1 ? 's' : ''}</p>
          <div className="w-16 h-1 bg-primary-600 mt-4 rounded sm:mx-0 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div 
              key={review._id} 
              className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 font-bold">
                    {review.user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {review.user?.firstName} {review.user?.lastName}
                    </h4>
                    {review.isVerifiedPurchase && (
                      <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={14} 
                      className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'} 
                    />
                  ))}
                </div>
              </div>

              {review.title && (
                <h5 className="font-bold text-gray-900 dark:text-white mb-2 break-words">{review.title}</h5>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 leading-relaxed break-words whitespace-pre-wrap overflow-hidden">
                {review.comment}
              </p>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  {review.images.map((img, idx) => (
                    <a href={img.url} target="_blank" rel="noopener noreferrer" key={idx} className="block w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity">
                      <img src={img.url} alt="Review attachment" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
