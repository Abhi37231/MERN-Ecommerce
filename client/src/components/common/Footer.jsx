import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand & About */}
          <div>
            <Link to="/" className="inline-block mb-6">
              <span className="text-2xl font-bold tracking-tight text-white">
                Craft<span className="text-primary-500">ora</span>.
              </span>
            </Link>

            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Your ultimate shopping destination for premium quality products.
              We deliver the best shopping experience with top-notch customer
              service.
            </p>

            <div className="flex space-x-4">
              <a href="https://www.instagram.com/artful.decorates?igsh=MXY5azAxeGVza28yaQ==" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/products"
                  className="hover:text-primary-400 transition-colors"
                >
                  Shop All
                </Link>
              </li>

              <li>
                <Link
                  to="/categories"
                  className="hover:text-primary-400 transition-colors"
                >
                  Categories
                </Link>
              </li>

              <li>
                <Link
                  to="/products/new-arrivals"
                  className="hover:text-primary-400 transition-colors"
                >
                  New Arrivals
                </Link>
              </li>

              <li>
                <Link
                  to="/products?sort=discount"
                  className="hover:text-primary-400 transition-colors"
                >
                  Sale
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="hover:text-primary-400 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">
              Customer Service
            </h3>

            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/faq"
                  className="hover:text-primary-400 transition-colors"
                >
                  FAQ
                </Link>
              </li>

              <li>
                <Link
                  to="/shipping-policy"
                  className="hover:text-primary-400 transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/returns"
                  className="hover:text-primary-400 transition-colors"
                >
                  Returns & Exchanges
                </Link>
              </li>

              <li>
                <Link
                  to="/track-order"
                  className="hover:text-primary-400 transition-colors"
                >
                  Track Order
                </Link>
              </li>

              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-primary-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">
              Contact Us
            </h3>

            <ul className="space-y-4 text-sm">
              <li className="flex items-center">
                <Phone
                  size={18}
                  className="mr-3 text-primary-500 shrink-0"
                />
                <span>+91 9699838251</span>
              </li>

              <li className="flex items-center">
                <Mail
                  size={18}
                  className="mr-3 text-primary-500 shrink-0"
                />
                <a
                  href="mailto:abhinandanyalamante9@gmail.com"
                  className="hover:text-primary-400 transition-colors"
                >
                  abhinandanyalamante9@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Craftora. All rights reserved.
          </p>

          <div className="flex space-x-4 mt-4 md:mt-0">
            <div className="h-8 w-12 bg-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-400">
              VISA
            </div>

            <div className="h-8 w-12 bg-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-400">
              MC
            </div>

            <div className="h-8 w-12 bg-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-400">
              AMEX
            </div>

            <div className="h-8 w-12 bg-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-400">
              UPI
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;