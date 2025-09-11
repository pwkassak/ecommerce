import { Product } from '../types/index.js';

// Mock database - In production, this would be replaced with actual database queries
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'GAN 356 M 3x3 Speed Cube',
    description: 'The GAN 356 M is a professional magnetic speed cube designed for competitive speedcubing. Features exceptional corner cutting, smooth turning, and premium magnetic positioning system for enhanced stability and control.',
    price: 39.99,
    category: 'speed-cubes',
    imageUrl: '/images/gan-356m.jpg',
    images: ['/images/gan-356m.jpg', '/images/gan-356m-2.jpg', '/images/gan-356m-3.jpg'],
    specifications: {
      'Size': '56mm x 56mm x 56mm',
      'Weight': '75g',
      'Magnetic': 'Yes (48 magnets)',
      'Brand': 'GAN',
      'Material': 'ABS Plastic',
      'Corner Cutting': '50° / 30°',
      'Speed': 'Fast',
      'Difficulty': 'Advanced'
    },
    inStock: true,
    stockCount: 25,
    featured: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: 'MoYu Weilong WR M 3x3',
    description: 'World record setting cube with premium magnetic positioning and exceptional performance. Used by professional speedcubers worldwide.',
    price: 34.99,
    category: 'speed-cubes',
    imageUrl: '/images/moyu-weilong.jpg',
    images: ['/images/moyu-weilong.jpg', '/images/moyu-weilong-2.jpg'],
    specifications: {
      'Size': '55.5mm x 55.5mm x 55.5mm',
      'Weight': '78g',
      'Magnetic': 'Yes (48 magnets)',
      'Brand': 'MoYu',
      'Material': 'ABS Plastic',
      'Corner Cutting': '45° / 30°',
      'Speed': 'Very Fast',
      'Difficulty': 'Advanced'
    },
    inStock: true,
    stockCount: 18,
    featured: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z'
  },
  {
    id: '3',
    name: 'Megaminx Dodecahedron Puzzle',
    description: 'A 12-sided puzzle cube that provides a unique challenge for advanced solvers. Features smooth turning and vibrant colors.',
    price: 24.99,
    category: 'megaminx',
    imageUrl: '/images/megaminx.jpg',
    images: ['/images/megaminx.jpg', '/images/megaminx-2.jpg'],
    specifications: {
      'Faces': '12',
      'Colors': '12',
      'Difficulty': 'Advanced',
      'Brand': 'QiYi',
      'Material': 'ABS Plastic',
      'Size': '70mm diameter',
      'Weight': '120g',
      'Magnetic': 'No'
    },
    inStock: true,
    stockCount: 12,
    featured: true,
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z'
  },
  {
    id: '4',
    name: 'QiYi Valk 3 Elite M',
    description: 'Premium flagship cube with customizable magnets and exceptional performance.',
    price: 42.99,
    category: 'speed-cubes',
    imageUrl: '/images/qiyi-valk3.jpg',
    images: ['/images/qiyi-valk3.jpg'],
    specifications: {
      'Size': '55.5mm x 55.5mm x 55.5mm',
      'Magnetic': 'Yes (48 magnets)',
      'Brand': 'QiYi',
      'Material': 'ABS Plastic',
      'Corner Cutting': '50° / 35°',
      'Speed': 'Fast',
      'Difficulty': 'Advanced'
    },
    inStock: true,
    stockCount: 15,
    featured: false,
    createdAt: '2024-01-04T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z'
  },
  {
    id: '5',
    name: 'Rubiks Brand 3x3 Cube',
    description: 'The original Rubiks cube for beginners and collectors.',
    price: 12.99,
    category: 'puzzle-cubes',
    imageUrl: '/images/rubiks-original.jpg',
    images: ['/images/rubiks-original.jpg'],
    specifications: {
      'Size': '57mm x 57mm x 57mm',
      'Magnetic': 'No',
      'Brand': 'Rubiks',
      'Material': 'ABS Plastic',
      'Difficulty': 'Beginner',
      'Speed': 'Medium',
      'Type': 'Original'
    },
    inStock: true,
    stockCount: 50,
    featured: false,
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-05T00:00:00.000Z'
  },
  {
    id: '6',
    name: 'Pyraminx Triangle Puzzle',
    description: 'Triangular puzzle with unique solving mechanics and colorful design.',
    price: 18.99,
    category: 'pyraminx',
    imageUrl: '/images/pyraminx.jpg',
    images: ['/images/pyraminx.jpg'],
    specifications: {
      'Shape': 'Triangle',
      'Difficulty': 'Medium',
      'Brand': 'QiYi',
      'Material': 'ABS Plastic',
      'Size': '98mm x 98mm x 98mm',
      'Colors': '4',
      'Type': 'Tetrahedron'
    },
    inStock: false,
    stockCount: 0,
    featured: false,
    createdAt: '2024-01-06T00:00:00.000Z',
    updatedAt: '2024-01-06T00:00:00.000Z'
  },
  {
    id: '7',
    name: 'Skewb Diamond Cube',
    description: 'Corner-turning puzzle with diamond shape and smooth mechanism.',
    price: 16.99,
    category: 'skewb',
    imageUrl: '/images/skewb.jpg',
    images: ['/images/skewb.jpg'],
    specifications: {
      'Shape': 'Diamond',
      'Difficulty': 'Medium',
      'Brand': 'MoYu',
      'Material': 'ABS Plastic',
      'Size': '60mm x 60mm x 60mm',
      'Colors': '6',
      'Type': 'Corner-turning'
    },
    inStock: true,
    stockCount: 8,
    featured: false,
    createdAt: '2024-01-07T00:00:00.000Z',
    updatedAt: '2024-01-07T00:00:00.000Z'
  },
  {
    id: '8',
    name: 'XMan Design Tornado V3 M',
    description: 'Latest flagship speed cube with advanced magnetic system.',
    price: 45.99,
    category: 'speed-cubes',
    imageUrl: '/images/tornado-v3.jpg',
    images: ['/images/tornado-v3.jpg'],
    specifications: {
      'Size': '55.5mm x 55.5mm x 55.5mm',
      'Magnetic': 'Yes (48 magnets)',
      'Brand': 'XMan Design',
      'Material': 'ABS Plastic',
      'Corner Cutting': '50° / 30°',
      'Speed': 'Very Fast',
      'Difficulty': 'Expert'
    },
    inStock: true,
    stockCount: 22,
    featured: false,
    createdAt: '2024-01-08T00:00:00.000Z',
    updatedAt: '2024-01-08T00:00:00.000Z'
  }
];

export class ProductModel {
  static async getAll(filters?: {
    category?: string;
    featured?: boolean;
    inStock?: boolean;
    page?: number;
    limit?: number;
  }) {
    let products = [...mockProducts];
    
    // Apply filters
    if (filters?.category) {
      products = products.filter(p => p.category === filters.category);
    }
    
    if (filters?.featured !== undefined) {
      products = products.filter(p => p.featured === filters.featured);
    }
    
    if (filters?.inStock !== undefined) {
      products = products.filter(p => p.inStock === filters.inStock);
    }
    
    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: products.length,
        totalPages: Math.ceil(products.length / limit)
      }
    };
  }
  
  static async getById(id: string): Promise<Product | null> {
    return mockProducts.find(p => p.id === id) || null;
  }
  
  static async getFeatured(): Promise<Product[]> {
    return mockProducts.filter(p => p.featured && p.inStock);
  }
  
  static async getByCategory(category: string): Promise<Product[]> {
    return mockProducts.filter(p => p.category === category);
  }
  
  static async search(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return mockProducts.filter(p => 
      p.name.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery) ||
      p.category.toLowerCase().includes(lowercaseQuery)
    );
  }
}