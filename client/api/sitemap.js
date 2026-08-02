import axios from 'axios';

export default async function handler(req, res) {
  // We want to generate sitemap on the fly.
  const baseUrl = 'https://mern-ecommerce-eta-steel.vercel.app';
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:5000/api/v1';

  try {
    // Fetch products and categories to dynamically generate sitemap URLs
    // Using simple GET requests. Limit should be high enough or we fetch all pages.
    // Assuming backend returns a large limit or all.
    const productsRes = await axios.get(`${apiUrl}/products?limit=1000`);
    const products = productsRes.data?.data?.products || productsRes.data?.products || [];

    const categoriesRes = await axios.get(`${apiUrl}/categories`);
    const categories = categoriesRes.data?.data?.categories || categoriesRes.data?.categories || [];

    const date = new Date().toISOString();

    const staticPages = [
      '',
      '/products',
      '/categories',
      '/login',
      '/register',
      '/cart',
      '/wishlist'
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((page) => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`)
    .join('')}
  ${products
    .map((product) => `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updatedAt || date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`)
    .join('')}
  ${categories
    .map((category) => `
  <url>
    <loc>${baseUrl}/products?category=${category._id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
    .join('')}
</urlset>`;

    res.setHeader('Content-Type', 'text/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400'); // Cache on CDN for 1 day
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Internal server error generating sitemap' });
  }
}
