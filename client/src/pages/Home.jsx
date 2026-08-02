import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, ShoppingBag, ShieldCheck, Truck, Clock } from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setIsLoading(true);
        // We can fetch these in parallel
        const [featuredRes, trendingRes, categoriesRes] = await Promise.all([
          api.get('/products/featured?limit=4'),
          api.get('/products/trending?limit=4'),
          api.get('/categories?parent=null')
        ]);

        let fetchedCategories = categoriesRes.data.categories || [];
        
        // Fetch sample products for top 4 categories to show in stacked effect
        const topCategories = fetchedCategories.slice(0, 4);
        const categoriesWithProducts = await Promise.all(
          topCategories.map(async (cat) => {
            try {
              const prodRes = await api.get(`/products?category=${cat._id}&limit=2`);
              const products = prodRes.data.products || [];
              return {
                ...cat,
                sampleProductImage1: products[0]?.images?.[0]?.url || null,
                sampleProductImage2: products[1]?.images?.[0]?.url || products[0]?.images?.[0]?.url || null
              };
            } catch (err) {
              return cat;
            }
          })
        );
        
        fetchedCategories = [
          ...categoriesWithProducts,
          ...fetchedCategories.slice(4)
        ];

        setFeaturedProducts(featuredRes.data.products || []);
        setTrendingProducts(trendingRes.data.products || []);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error('Failed to fetch home data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const features = [
    { icon: <Truck className="w-6 h-6" />, title: 'Free Shipping', desc: 'On orders over ₹1000' },
    { icon: <ShieldCheck className="w-6 h-6" />, title: 'Secure Payment', desc: '100% secure payment' },
    { icon: <Clock className="w-6 h-6" />, title: '24/7 Support', desc: 'Dedicated support' },
  ];

  return (
    <div className="bg-white dark:bg-dark-deep transition-colors duration-300">

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-transparent dark:from-dark-deep/90 dark:via-dark-deep/70 z-10" />
          <img
            src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop"
            alt="Interior Decor Background"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <span className="inline-block py-1 px-3 border border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-400 text-xs font-serif uppercase tracking-[0.2em] mb-6">
              Handcrafted with Love
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-gray-900 dark:text-white leading-[1.1] mb-6">
              Crafted with <br />
              <span className="text-primary-700 dark:text-primary-400 italic">Love.</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-light max-w-lg">
              Beautiful handmade bouquets, keychains, flower pots, gifts, and custom creations for every special occasion.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="btn btn-primary px-10 py-4 text-sm uppercase tracking-widest">
                Shop Collection
              </Link>
              <Link to="/custom-request" className="btn btn-secondary px-10 py-4 text-sm uppercase tracking-widest bg-transparent">
                Custom Orders
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
            {features.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center pt-8 md:pt-0 first:pt-0">
                <div className="h-12 w-12 rounded-full bg-primary-50 dark:bg-gray-800 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">

        {/* Categories Section */}
        <section>
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif text-gray-900 dark:text-white">Shop by Category</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-3 font-light text-lg">Curated collections for every space</p>
            </div>
            <Link to="/categories" className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium transition-colors">
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-4 pb-8">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-64 rounded-2xl w-full"></div>
              ))
            ) : (
              categories.slice(0, 4).map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="group relative block h-64"
                >
                  {/* Back Image (Stacked Effect) */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-md transform translate-x-3 translate-y-3 rotate-3 transition-all duration-500 group-hover:translate-x-5 group-hover:translate-y-5 group-hover:rotate-6 z-0 bg-gray-200 dark:bg-gray-800">
                    <img
                      src={category.sampleProductImage1 || category.image?.url || 'https://via.placeholder.com/400x500?text=Category'}
                      alt={`${category.name} background`}
                      className="w-full h-full object-cover opacity-80"
                    />
                  </div>
                  
                  {/* Front Image */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-sm z-10 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={category.sampleProductImage2 || category.image?.url || 'https://via.placeholder.com/400x500?text=Category'}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                      <h3 className="text-xl md:text-2xl font-serif text-white mb-2">{category.name}</h3>
                      <span className="text-xs uppercase tracking-widest font-medium text-primary-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center">
                        Discover <ArrowRight className="ml-2 w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Handpicked for you</p>
            </div>
            <Link to="/products" className="hidden sm:flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium transition-colors">
              View All <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-[400px] rounded-xl w-full"></div>
              ))
            ) : (
              featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            )}
          </div>
        </section>

        {/* Trending Now Heading */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">What everyone is buying</p>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="relative overflow-hidden bg-primary-900 text-white">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=2130&auto=format&fit=crop"
              alt="Promo"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
          </div>
          <div className="relative z-10 px-8 py-24 md:py-32 md:px-24 flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="text-primary-200 font-serif italic tracking-wider mb-4 text-xl">Bespoke Commissions</span>
            <h2 className="text-4xl md:text-6xl font-serif mb-8 leading-tight">Bring Your Vision to Life.</h2>
            <p className="text-primary-100 text-lg mb-10 font-light max-w-xl">
              Work directly with our master artisans to create a personalized piece of art that perfectly complements your space.
            </p>
            <Link to="/custom-request" className="btn bg-white text-primary-900 hover:bg-gray-100 px-10 py-4 uppercase tracking-widest text-sm">
              Request a Quote
            </Link>
          </div>
        </section>

        {/* Trending Products Grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-[400px] rounded-xl w-full"></div>
              ))
            ) : (
              trendingProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Newsletter Section */}
      <section className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Join Our Newsletter</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto" onSubmit={(e) => { e.preventDefault(); toast.success('Subscribed successfully!'); }}>
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="input-field flex-grow py-3 px-4"
            />
            <button type="submit" className="btn btn-primary px-6 py-3 whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

// Mini Product Card Component (Should be moved to components/product/ProductCard.jsx eventually)
const ProductCard = ({ product }) => {
  const discountAmount = product.price * (product.discountPercentage / 100);
  const currentPrice = product.price - discountAmount;

  return (
    <div className="group card flex flex-col h-full hover:shadow-lg transition-all duration-300">
      {/* Image container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <Link to={`/products/${product.slug}`}>
          <img
            src={product.images?.[0]?.url || 'https://via.placeholder.com/400x500?text=Product'}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.discountPercentage > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{product.discountPercentage}%
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded">
              NEW
            </span>
          )}
        </div>

        {/* Quick Add Action (Visible on hover) */}
        <div className="absolute bottom-4 left-0 right-0 px-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button className="w-full btn bg-white/90 backdrop-blur text-gray-900 hover:bg-primary-600 hover:text-white shadow-sm flex justify-center items-center py-2.5">
            <ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {product.category?.name || 'Category'}
          </span>
          <div className="flex items-center text-yellow-400">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
              {product.ratingsAverage}
            </span>
          </div>
        </div>

        <Link to={`/products/${product.slug}`} className="block mt-1 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-center gap-2">
          <span className="text-base font-bold text-gray-900 dark:text-white">
            ₹{currentPrice.toFixed(2)}
          </span>
          {product.discountPercentage > 0 && (
            <span className="text-sm text-gray-500 line-through">
              ₹{product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
