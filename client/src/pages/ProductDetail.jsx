import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Truck, ShieldCheck, RefreshCw, Minus, Plus, ShoppingBag, Heart, Check, ChevronRight, ChevronLeft, Sparkles, XCircle, ShieldOff, Lock, MessageCircle, Package } from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { openCart } from '../redux/slices/cartSlice';
import { addToCart } from '../redux/slices/cartSlice';
import { toggleWishlist } from '../redux/slices/wishlistSlice';
import ProductReviews from '../components/reviews/ProductReviews';

const ProductDetail = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeImage, setActiveImage] = useState('');
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch Product
        const productRes = await api.get(`/products/${slug}`);
        const prodData = productRes.data.product;
        setProduct(prodData);

        if (prodData.images && prodData.images.length > 0) {
          setActiveImage(prodData.images[0].url);
        }

        // Default variant selections
        if (prodData.variants && prodData.variants.length > 0) {
          const defaults = {};
          prodData.variants.forEach(v => {
            if (v.options && v.options.length > 0) {
              defaults[v.name] = v.options[0];
            }
          });
          setSelectedVariants(defaults);
        }

        // 2. Fetch Related Products & Reviews
        const [relatedRes, reviewsRes] = await Promise.all([
          api.get(`/products/${prodData._id}/related`),
          api.get(`/products/${prodData._id}/reviews?limit=5`)
        ]);

        setRelatedProducts(relatedRes.data.products || []);
        setReviews(reviewsRes.data.reviews || []);

      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Product not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchProductDetails();
      // Reset state on slug change
      setQuantity(1);
      window.scrollTo(0, 0);
    }
  }, [slug]);

  // Slideshow auto-play effect
  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1 || isHoveringImage) return;

    const timer = setInterval(() => {
      const currentIndex = product.images.findIndex(img => img.url === activeImage);
      const nextIndex = (currentIndex + 1) % product.images.length;
      setActiveImage(product.images[nextIndex].url);
    }, 4000); // 4 seconds

    return () => clearInterval(timer);
  }, [product, activeImage, isHoveringImage]);

  const handleNextImage = () => {
    if (!product?.images) return;
    const currentIndex = product.images.findIndex(img => img.url === activeImage);
    const nextIndex = (currentIndex + 1) % product.images.length;
    setActiveImage(product.images[nextIndex].url);
  };

  const handlePrevImage = () => {
    if (!product?.images) return;
    const currentIndex = product.images.findIndex(img => img.url === activeImage);
    const prevIndex = (currentIndex - 1 + product.images.length) % product.images.length;
    setActiveImage(product.images[prevIndex].url);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await dispatch(addToCart({
        productId: product._id,
        quantity,
        variant: selectedVariants
      })).unwrap();

      toast.success(`${product.name} added to cart`);
      dispatch(openCart());
    } catch (error) {
      toast.error(error.message || 'Failed to add to cart');
    }
  };

  const handleRequestRestock = async () => {
    if (!product) return;

    try {
      await api.post(`/products/${product._id}/restock`);
      toast.success('Restock request submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit restock request');
    }
  };

  const handleVariantChange = (name, value) => {
    setSelectedVariants(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 skeleton h-[500px] rounded-2xl"></div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="skeleton h-8 w-3/4 rounded"></div>
            <div className="skeleton h-6 w-1/4 rounded"></div>
            <div className="skeleton h-24 w-full rounded mt-8"></div>
            <div className="skeleton h-12 w-1/2 rounded mt-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h2>
        <Link to="/products" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const discountAmount = product.price * (product.discountPercentage / 100);
  const currentPrice = product.price - discountAmount;

  return (
    <div className="bg-white dark:bg-dark-deep pb-16">

      {/* Breadcrumbs */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link to="/products" className="hover:text-primary-600 transition-colors">Shop</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          {product.category && (
            <>
              <Link to={`/products?category=${product.category._id}`} className="hover:text-primary-600 transition-colors">
                {product.category.name}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
            </>
          )}
          <span className="text-gray-900 dark:text-gray-200 font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-12 lg:gap-16">

          {/* Product Gallery */}
          <div className="w-full md:w-1/2">
            <div
              className="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-gray-800 shadow-sm group"
              onMouseEnter={() => setIsHoveringImage(true)}
              onMouseLeave={() => setIsHoveringImage(false)}
            >
              <img
                src={activeImage || 'https://via.placeholder.com/600'}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 ease-in-out"
              />

              {/* Carousel Arrows */}
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 p-2 rounded-full shadow-md text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-900/80 dark:hover:bg-gray-900 p-2 rounded-full shadow-md text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(img.url)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${activeImage === img.url ? 'bg-primary-600 scale-125' : 'bg-white/60 hover:bg-white'}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.discountPercentage > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-sm tracking-wide shadow-sm">
                    -{product.discountPercentage}% OFF
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-sm tracking-wide shadow-sm">
                    OUT OF STOCK
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img.url)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeImage === img.url
                        ? 'border-primary-600 shadow-md scale-95'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="w-full md:w-1/2 flex flex-col">

            {/* Header */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 tracking-wider uppercase mb-2">
                {product.brand}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-gray-900 dark:text-white leading-tight mb-4">
                {product.name}
              </h1>

              {/* Reviews summary */}
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(product.ratingsAverage || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {product.ratingsAverage} ({product.ratingsCount || 0} reviews)
                  </span>
                </div>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-green-600 dark:text-green-400">{Math.max(0, product.soldCount || 0)}</span> sold
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ₹{currentPrice.toFixed(2)}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="text-xl text-gray-500 line-through decoration-gray-400 font-medium mb-1">
                    ₹{product.price.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Local taxes included (where applicable)</p>
            </div>

            {/* Description Short */}
            <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
              {product.shortDescription || product.description}
            </p>

            <hr className="border-gray-200 dark:border-gray-800 mb-8" />

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-6 mb-8">
                {product.variants.map((variant, idx) => (
                  <div key={idx}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex justify-between">
                      <span>{variant.name}</span>
                      <span className="text-gray-500 font-normal">{selectedVariants[variant.name]}</span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {variant.options.map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          onClick={() => handleVariantChange(variant.name, opt)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${selectedVariants[variant.name] === opt
                              ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-300 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Area */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Quantity */}
              <div className="flex items-center justify-between border-2 border-gray-200 dark:border-gray-700 rounded-xl px-2 h-14 sm:w-32 bg-white dark:bg-gray-900">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-semibold text-gray-900 dark:text-white w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-50"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart / Request Restock */}
              <button
                onClick={product.stock > 0 ? handleAddToCart : handleRequestRestock}
                className={`flex-1 btn h-14 text-lg font-semibold shadow-lg disabled:shadow-none ${product.stock > 0 ? 'btn-primary shadow-primary-500/30' : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600'
                  }`}
              >
                {product.stock > 0 ? (
                  <>
                    <ShoppingBag className="w-5 h-5 mr-2 inline" /> Add to Cart
                  </>
                ) : (
                  'Request Restock'
                )}
              </button>

              {/* Wishlist */}
              <button
                onClick={() => dispatch(toggleWishlist(product._id))}
                className={`h-14 w-14 flex items-center justify-center border-2 rounded-xl transition-all ${wishlistItems.some(item => item._id === product._id)
                    ? 'border-red-200 bg-red-50 text-red-500 dark:bg-red-900/20 dark:border-red-800'
                    : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
              >
                <Heart className={`w-6 h-6 ${wishlistItems.some(item => item._id === product._id) ? 'fill-red-500' : ''}`} />
              </button>
            </div>

            {/* Stock and COD status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm mb-8">
              <div className="flex items-center">
                {product.stock > 0 ? (
                  <>
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">{product.stock}</span> items left in stock
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-red-600 dark:text-red-400 font-medium">Out of stock</span>
                  </>
                )}
              </div>

              <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-700"></div>

              <div className="flex items-center">
                {product.codAvailable === false ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-xs">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> COD Not Available
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium text-xs">
                    <Check className="w-3.5 h-3.5 mr-1" /> Cash on Delivery Available
                  </span>
                )}
              </div>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-y border-gray-200 dark:border-gray-800">
              
              <div className="flex items-start p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 group">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Heart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Artisan Crafted</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Carefully handcrafted by skilled artisans with attention to every detail.</p>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 group">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Carefully Packed</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Every order is packed with care to ensure it arrives safely.</p>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 group">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Truck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Quick Shipping</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Orders are processed and dispatched within 1–3 business days.</p>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 group">
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 mr-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Safe & Secure Payments</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Your payment is protected with SSL encryption and trusted payment gateways.</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif text-gray-900 dark:text-white">Curated For You</h2>
              <div className="w-16 h-1 bg-primary-600 mx-auto mt-4 rounded"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <Link
                  key={rp._id}
                  to={`/products/${rp.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900">
                    <img
                      src={rp.images?.[0]?.url || 'https://via.placeholder.com/400'}
                      alt={rp.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 mb-1">{rp.name}</h3>
                    <p className="font-bold text-primary-600 dark:text-primary-400">₹{rp.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      <ProductReviews reviews={reviews} totalReviews={product.ratingsCount || reviews.length} />
    </div>
  );
};

export default ProductDetail;
