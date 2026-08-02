import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { fetchWishlist, removeFromWishlist } from '../redux/slices/wishlistSlice';
import { addToCart, openCart } from '../redux/slices/cartSlice';
import toast from 'react-hot-toast';
import SEO from '../components/common/SEO';

const Wishlist = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleAddToCart = async (product) => {
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to cart`);
      dispatch(openCart());
    } catch (err) {
      toast.error(err || 'Failed to add item');
    }
  };

  const handleRemove = (productId) => {
    dispatch(removeFromWishlist(productId));
    toast.success('Removed from wishlist');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="skeleton h-8 w-48 mb-8 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-12">
      <SEO title="Wishlist" noindex={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <Heart className="text-red-500 fill-red-500" /> My Wishlist
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Items you've saved for later ({items.length})
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={36} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Explore our shop and save your favorite items to your wishlist.
            </p>
            <Link to="/products" className="btn btn-primary px-8 py-3">
              Explore Products <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((prod) => (
              <div
                key={prod._id}
                className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <Link to={`/products/${prod.slug}`}>
                    <img
                      src={prod.images?.[0]?.url || 'https://placehold.co/400'}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <button
                    onClick={() => handleRemove(prod._id)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-400 hover:text-red-500 shadow transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                      <Link to={`/products/${prod.slug}`}>{prod.name}</Link>
                    </h3>
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      ₹{prod.price}
                    </p>
                  </div>

                  <button
                    onClick={() => handleAddToCart(prod)}
                    className="btn btn-primary w-full mt-4 flex items-center justify-center gap-2 py-2.5"
                  >
                    <ShoppingBag size={16} /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
