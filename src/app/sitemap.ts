import { MetadataRoute } from 'next';
import { SAMPLE_PRODUCTS, CATEGORIES, REGIONS } from '@/lib/sample-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://preheritage.com';

  const productRoutes = SAMPLE_PRODUCTS.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/shop?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const regionRoutes = REGIONS.map((r) => ({
    url: `${baseUrl}/shop?region=${r.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const staticRoutes = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/journal',
    '/faq',
    '/shipping-policy',
    '/return-policy',
    '/privacy-policy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...regionRoutes];
}
