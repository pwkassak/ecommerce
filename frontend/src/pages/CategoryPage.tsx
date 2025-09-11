import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';

const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');
  const [filterInStock, setFilterInStock] = useState(false);

  const categoryNames: Record<string, string> = {
    'speed-cubes': 'Speed Cubes',
    'puzzle-cubes': 'Puzzle Cubes',
    'megaminx': 'Megaminx Cubes',
    'pyraminx': 'Pyraminx Cubes',
    'skewb': 'Skewb Cubes',
    'other': 'Other Puzzles'
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Mock product data - will be replaced with API call
        const allProducts: Product[] = [
          {
            id: '1',
            name: 'GAN 356 M 3x3 Speed Cube',
            description: 'Professional magnetic speed cube with exceptional corner cutting',
            price: 39.99,
            category: 'speed-cubes',
            imageUrl: '/images/gan-356m.jpg',
            images: ['/images/gan-356m.jpg'],
            specifications: { 'Size': '56mm', 'Magnetic': 'Yes', 'Brand': 'GAN' },
            inStock: true,
            stockCount: 25,
            featured: true
          },
          {
            id: '2',
            name: 'MoYu Weilong WR M 3x3',
            description: 'World record setting cube with premium magnetic positioning',
            price: 34.99,
            category: 'speed-cubes',
            imageUrl: '/images/moyu-weilong.jpg',
            images: ['/images/moyu-weilong.jpg'],
            specifications: { 'Size': '55.5mm', 'Magnetic': 'Yes', 'Brand': 'MoYu' },
            inStock: true,
            stockCount: 18,
            featured: true
          },
          {
            id: '4',
            name: 'QiYi Valk 3 Elite M',
            description: 'Premium flagship cube with customizable magnets',
            price: 42.99,
            category: 'speed-cubes',
            imageUrl: '/images/qiyi-valk3.jpg',
            images: ['/images/qiyi-valk3.jpg'],
            specifications: { 'Size': '55.5mm', 'Magnetic': 'Yes', 'Brand': 'QiYi' },
            inStock: true,
            stockCount: 15,
            featured: false
          },
          {
            id: '5',
            name: 'Rubiks Brand 3x3 Cube',
            description: 'The original Rubiks cube for beginners',
            price: 12.99,
            category: 'puzzle-cubes',
            imageUrl: '/images/rubiks-original.jpg',
            images: ['/images/rubiks-original.jpg'],
            specifications: { 'Size': '57mm', 'Magnetic': 'No', 'Brand': 'Rubiks' },
            inStock: true,
            stockCount: 50,
            featured: false
          },
          {
            id: '3',
            name: 'Megaminx Dodecahedron Puzzle',
            description: '12-sided puzzle cube for advanced solvers',
            price: 24.99,
            category: 'megaminx',
            imageUrl: '/images/megaminx.jpg',
            images: ['/images/megaminx.jpg'],
            specifications: { 'Faces': '12', 'Colors': '12', 'Brand': 'QiYi' },
            inStock: true,
            stockCount: 12,
            featured: true
          },
          {
            id: '6',
            name: 'Pyraminx Triangle Puzzle',
            description: 'Triangular puzzle with unique solving mechanics',
            price: 18.99,
            category: 'pyraminx',
            imageUrl: '/images/pyraminx.jpg',
            images: ['/images/pyraminx.jpg'],
            specifications: { 'Shape': 'Triangle', 'Difficulty': 'Medium', 'Brand': 'QiYi' },
            inStock: false,
            stockCount: 0,
            featured: false
          },
          {
            id: '7',
            name: 'Skewb Diamond Cube',
            description: 'Corner-turning puzzle with diamond shape',
            price: 16.99,
            category: 'skewb',
            imageUrl: '/images/skewb.jpg',
            images: ['/images/skewb.jpg'],
            specifications: { 'Shape': 'Diamond', 'Difficulty': 'Medium', 'Brand': 'MoYu' },
            inStock: true,
            stockCount: 8,
            featured: false
          }
        ];

        // Filter by category
        const categoryProducts = allProducts.filter(product => product.category === category);
        setProducts(categoryProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchProducts();
    }
  }, [category]);

  const filteredAndSortedProducts = products
    .filter(product => !filterInStock || product.inStock)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const categoryName = category ? categoryNames[category] || 'Products' : 'Products';

  return (
    <div className="category-page">
      <div className="container">
        <div className="page-header">
          <h1>{categoryName}</h1>
          <p>Find the perfect cube for your skill level and style</p>
        </div>

        <div className="filters-toolbar">
          <div className="filter-group">
            <label htmlFor="sort-select">Sort by:</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name">Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filterInStock}
                onChange={(e) => setFilterInStock(e.target.checked)}
              />
              In stock only
            </label>
          </div>
        </div>

        <div className="products-section">
          {loading ? (
            <div className="loading">Loading products...</div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="no-products">No products found in this category.</div>
          ) : (
            <div className="products-grid">
              {filteredAndSortedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;