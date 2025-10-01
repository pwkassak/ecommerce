import { Router, Request, Response } from 'express';
import { OpenFeature } from '@openfeature/server-sdk';
import { ProductModel } from '../models/products.js';
import { ApiResponse, PaginatedResponse } from '../types/index.js';

const router = Router();

// GET /api/products - Get all products with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      featured,
      inStock,
      page = '1',
      limit = '10',
      search
    } = req.query;

    if (search) {
      const products = await ProductModel.search(search as string);
      const response: ApiResponse<typeof products> = {
        data: products,
        success: true,
        message: `Found ${products.length} products matching "${search}"`
      };
      return res.json(response);
    }

    const filters = {
      category: category as string,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await ProductModel.getAll(filters);

    // For featured products requests (homepage), include experiments and categories
    let experiments: any = {};
    let categories: any[] = [];

    if (featured === 'true' && req.evaluationContext) {
      // Evaluate feature flag using OpenFeature API with per-request context
      const client = OpenFeature.getClient();
      const details = await client.getBooleanDetails(
        'remove-quick-links',
        false,
        req.evaluationContext
      );
      const shouldHideCategories = details.value;

      // DEBUG: Log what OpenFeature is returning
      console.log('🔍 OpenFeature getBooleanDetails result:', {
        value: details.value,
        reason: details.reason,
        variant: details.variant,
        flagMetadata: details.flagMetadata
      });

      // Build experiment metadata for frontend tracking
      // Only include if we have experiment metadata from the provider
      if (details.flagMetadata?.experimentId) {
        experiments = {
          'remove-quick-links': {
            experiment_id: details.flagMetadata.experimentId,
            variation_id: String(details.flagMetadata.variationId ?? ''),
            value: shouldHideCategories
          }
        };
      }

      // Get categories data based on feature flag
      if (!shouldHideCategories) {
        categories = [
          { id: 'speed', name: 'Speed Cubes', description: 'Professional racing cubes' },
          { id: 'puzzle', name: 'Puzzle Cubes', description: 'Classic and specialty puzzles' },
          { id: 'megaminx', name: 'Megaminx', description: '12-sided challenge cubes' },
          { id: 'pyraminx', name: 'Pyraminx', description: 'Triangular puzzle cubes' }
        ];
      }
    }

    const response = featured === 'true' ? {
      data: {
        products: result.products,
        categories: categories
      },
      success: true,
      message: `Retrieved ${result.products.length} products`,
      pagination: result.pagination,
      experiments: experiments
    } as any : {
      data: result.products,
      success: true,
      message: `Retrieved ${result.products.length} products`,
      pagination: result.pagination
    } as PaginatedResponse<any>;

    res.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      data: [],
      success: false,
      message: 'Failed to fetch products'
    });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.getFeatured();
    
    const response: ApiResponse<typeof products> = {
      data: products,
      success: true,
      message: `Retrieved ${products.length} featured products`
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({
      data: [],
      success: false,
      message: 'Failed to fetch featured products'
    });
  }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const products = await ProductModel.getByCategory(category);
    
    const response: ApiResponse<typeof products> = {
      data: products,
      success: true,
      message: `Retrieved ${products.length} products in category "${category}"`
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      data: [],
      success: false,
      message: 'Failed to fetch products by category'
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.getById(id);
    
    if (!product) {
      return res.status(404).json({
        data: null,
        success: false,
        message: 'Product not found'
      });
    }

    const response: ApiResponse<typeof product> = {
      data: product,
      success: true,
      message: 'Product retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({
      data: null,
      success: false,
      message: 'Failed to fetch product'
    });
  }
});

export default router;