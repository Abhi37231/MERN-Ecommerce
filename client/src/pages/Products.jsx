import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, Filter, Star, ShoppingBag, X, ChevronDown, 
  RotateCcw, Heart, Check, ArrowUpDown, ChevronLeft, ChevronRight 
} from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { addToCart, openCart } from '../redux/slices/cartSlice';
import { toggleWishlist, fetchWishlist } from '../redux/slices/wishlistSlice';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist?.items || []);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    inStock: searchParams.get('inStock') === 'true',
    sortBy: searchParams.get('sortBy') || 'newest',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data?.categories || res.data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();

    if (isAuthenticated) {
      dispatch(fetchWishlist());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== '' && value !== false) {
            queryParams.append(key, value);
          }
        });
        queryParams.append('page', page);
        queryParams.append('limit', 12);

        setSearchParams(queryParams, { replace: true });

        const res = await api.get('/products?' + queryParams.toString());
        const data = res.data?.data || res.data || {};
        setProducts(data.products || res.data?.products || []);
        setTotalPages(res.pagination?.totalPages || data.pagination?.totalPages || 1);
        setTotalProducts(res.pagination?.total || data.pagination?.total || (data.products?.length || 0));
      } catch (error) {
        console.error('Failed to fetch products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filters, page]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      inStock: false,
      sortBy: 'newest',
    });
    setPage(1);
  };

  const handleAddToCart = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to add items to cart');
      return;
    }
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      toast.success(`${product.name} added to cart!`);
      dispatch(openCart());
    } catch (err) {
      toast.error(err || 'Failed to add to cart');
    }
  };

  const handleWishlistToggle = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to save items to wishlist');
      return;
    }
    dispatch(toggleWishlist(product._id));
  };

  const isWishlisted = (productId) => {
    return wishlistItems.some((item) => (item._id || item) === productId);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-serif text-gray-900 dark:text-white">Curated Collection</h1>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-light">
              Discover unique pieces that elevate your space. ({products.length} of {totalProducts} items)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field pr-10 py-2"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600">
                <Search size={18} />
              </button>
            </form>

            {/* Mobile Filter Toggle */}
            <button
              className="md:hidden btn btn-secondary py-2"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="w-4 h-4 mr-2" /> Filters
            </button>

            {/* Sort Selector */}
            <div className="relative">
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="input-field py-2 pr-8 text-sm font-medium"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm h-fit space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter size={18} /> Filters
              </h3>
              <button
                onClick={clearFilters}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleFilterChange({ target: { name: 'category', value: '' } })}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.category === ''
                      ? 'bg-primary-50 text-primary-600 font-semibold dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => handleFilterChange({ target: { name: 'category', value: cat._id } })}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filters.category === cat._id
                        ? 'bg-primary-50 text-primary-600 font-semibold dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Price Range (₹)</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="input-field py-1.5 text-xs"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="input-field py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Rating</h4>
              <div className="space-y-1.5">
                {[4, 3, 2, 1].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleFilterChange({ target: { name: 'rating', value: r.toString() } })}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      filters.rating === r.toString()
                        ? 'bg-primary-50 text-primary-600 font-semibold dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < r ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                        />
                      ))}
                      <span className="ml-1">& Up</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock Filter */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  name="inStock"
                  checked={filters.inStock}
                  onChange={handleFilterChange}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                In Stock Only
              </label>
            </div>
          </div>

          {/* Product Grid & Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                    <div className="skeleton aspect-square rounded-xl w-full"></div>
                    <div className="skeleton h-4 w-3/4 rounded"></div>
                    <div className="skeleton h-4 w-1/2 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-800">
                <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  We couldn't find any products matching your search criteria.
                </p>
                <button onClick={clearFilters} className="btn btn-primary">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((prod) => {
                    const wishlisted = isWishlisted(prod._id);
                    const discountedPrice = prod.discountPercentage > 0
                      ? prod.price * (1 - prod.discountPercentage / 100)
                      : prod.price;

                    return (
                      <div
                        key={prod._id}
                        className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <Link to={`/products/${prod.slug}`}>
                            <img
                              src={prod.images?.[0]?.url || 'https://via.placeholder.com/400'}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1">
                            {prod.discountPercentage > 0 && (
                              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                -{prod.discountPercentage}%
                              </span>
                            )}
                            {prod.stock === 0 && (
                              <span className="bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => handleWishlistToggle(prod, e)}
                            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all ${
                              wishlisted
                                ? 'bg-red-500 text-white'
                                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-red-500'
                            }`}
                          >
                            <Heart size={16} className={wishlisted ? 'fill-white' : ''} />
                          </button>
                        </div>

                        {/* Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider mb-1">
                              {prod.category?.name || prod.brand}
                            </p>
                            <Link to={`/products/${prod.slug}`}>
                              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 hover:text-primary-600 transition-colors">
                                {prod.name}
                              </h3>
                            </Link>

                            {/* Ratings */}
                            <div className="flex items-center gap-1 mt-2">
                              <Star size={14} className="fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                {prod.ratingsAverage || 4.5}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({prod.ratingsQuantity || 0})
                              </span>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <div>
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ₹{discountedPrice.toFixed(2)}
                              </span>
                              {prod.discountPercentage > 0 && (
                                <span className="text-xs text-gray-400 line-through ml-2">
                                  ₹{prod.price.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={(e) => handleAddToCart(prod, e)}
                              disabled={prod.stock === 0}
                              className="btn btn-primary p-2.5 rounded-xl disabled:opacity-50"
                              title="Add to Cart"
                            >
                              <ShoppingBag size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-secondary px-3 py-2 disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-medium text-sm transition-all ${
                          page === i + 1
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn btn-secondary px-3 py-2 disabled:opacity-40"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
