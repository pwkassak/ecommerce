import { Router, Request, Response } from 'express';
import { OrderModel } from '../models/orders.js';
import { ApiResponse, PaginatedResponse } from '../types/index.js';

const router = Router();

// POST /api/orders - Create a new order
router.post('/', async (req: Request, res: Response) => {
  try {
    const { customer, items, total } = req.body;

    // Basic validation
    if (!customer || !customer.email || !customer.firstName || !customer.lastName) {
      return res.status(400).json({
        data: null,
        success: false,
        message: 'Customer information is required'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: 'Order items are required'
      });
    }

    if (!total || typeof total !== 'number' || total <= 0) {
      return res.status(400).json({
        data: null,
        success: false,
        message: 'Valid order total is required'
      });
    }

    const order = await OrderModel.create({ customer, items, total });
    
    const response: ApiResponse<typeof order> = {
      data: order,
      success: true,
      message: 'Order created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      data: null,
      success: false,
      message: 'Failed to create order'
    });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.getById(id);
    
    if (!order) {
      return res.status(404).json({
        data: null,
        success: false,
        message: 'Order not found'
      });
    }

    const response: ApiResponse<typeof order> = {
      data: order,
      success: true,
      message: 'Order retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      data: null,
      success: false,
      message: 'Failed to fetch order'
    });
  }
});

// GET /api/orders - Get all orders with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      page = '1',
      limit = '10',
      email
    } = req.query;

    if (email) {
      const orders = await OrderModel.getByCustomerEmail(email as string);
      const response: ApiResponse<typeof orders> = {
        data: orders,
        success: true,
        message: `Retrieved ${orders.length} orders for ${email}`
      };
      return res.json(response);
    }

    const filters = {
      status: status as any,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    const result = await OrderModel.getAll(filters);
    
    const response: PaginatedResponse<any> = {
      data: result.orders,
      success: true,
      message: `Retrieved ${result.orders.length} orders`,
      pagination: result.pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      data: [],
      success: false,
      message: 'Failed to fetch orders'
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'processing', 'shipped', 'delivered'].includes(status)) {
      return res.status(400).json({
        data: null,
        success: false,
        message: 'Valid status is required (pending, processing, shipped, delivered)'
      });
    }

    const updatedOrder = await OrderModel.updateStatus(id, status);
    
    if (!updatedOrder) {
      return res.status(404).json({
        data: null,
        success: false,
        message: 'Order not found'
      });
    }

    const response: ApiResponse<typeof updatedOrder> = {
      data: updatedOrder,
      success: true,
      message: 'Order status updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      data: null,
      success: false,
      message: 'Failed to update order status'
    });
  }
});

export default router;