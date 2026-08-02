import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid, ArrowRight } from 'lucide-react';
import api from '../utils/axios';
import SEO from '../components/common/SEO';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const data = res.data?.data || res.data || {};
        setCategories(data.categories || res.data?.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-dark-deep min-h-screen py-12">
      <SEO 
        title="Categories" 
        description="Browse our diverse categories of handmade products and custom creations." 
        keywords="categories, shop by category, handmade products categories"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <Grid className="text-primary-600" /> All Categories
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Browse products by your favorite category
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              to={`/products?category=${cat._id}`}
              className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 rounded-xl flex items-center justify-center shrink-0">
                  {cat.topProducts?.length > 0 ? (
                    <>
                      {cat.topProducts[2] && (
                        <div className="absolute -bottom-1 -left-2 w-12 h-12 rounded-lg border-2 border-white dark:border-gray-900 overflow-hidden shadow-sm z-10 -rotate-12 bg-gray-100">
                          <img src={cat.topProducts[2]} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      {cat.topProducts[1] && (
                        <div className="absolute -top-1 -right-2 w-14 h-14 rounded-lg border-2 border-white dark:border-gray-900 overflow-hidden shadow-sm z-20 rotate-12 bg-gray-100">
                          <img src={cat.topProducts[1]} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className="absolute inset-0 m-auto w-16 h-16 rounded-lg border-2 border-white dark:border-gray-900 overflow-hidden shadow-md z-30 bg-white">
                        <img src={cat.topProducts[0]} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </>
                  ) : cat.image?.url ? (
                    <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover rounded-xl shadow-sm" loading="lazy" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <Grid size={28} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                    {cat.description || 'Explore products'}
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-primary-600 group-hover:text-white text-gray-400 flex items-center justify-center transition-all">
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
