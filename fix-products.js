const fs = require('fs');
const path = require('path');

const content = `import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Star, ShoppingBag, X, ChevronDown } from 'lucide-react';
import api from '../utils/axios';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
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
        setCategories(res.data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

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
        setProducts(res.data.products || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [filters, page, setSearchParams]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', rating: '', inStock: false, sortBy: 'newest' });
    setPage(1);
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
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Shop All</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Discover our collection</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="md:hidden btn btn-secondary" onClick={() => setIsFilterOpen(true)}><Filter className="w-4 h-4 mr-2" /> Filters</button>
            <div className="relative">
              <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange} className="input-field pr-10 py-2.5">
                {sortOptions.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>

            </div>
        </div>
        <div className="p-8 text-center">
          <Search className="w-8 h-8 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold">Products Page</h2>
        </div>
    </div>
  );
};


`;

const filePath = path.join(__dirname, 'client', 'src', 'pages', 'Products.jsx');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Products.jsx written successfully to', filePath);
