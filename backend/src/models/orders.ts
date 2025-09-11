import { Order, Customer } from '../types/index.js';

// Mock orders database
const mockOrders: Order[] = [];
let nextOrderId = 1;

export class OrderModel {
  static async create(orderData: {
    customer: Customer;
    items: any[];
    total: number;
  }): Promise<Order> {
    const newOrder: Order = {
      id: nextOrderId.toString(),
      customer: orderData.customer,
      items: orderData.items,
      total: orderData.total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockOrders.push(newOrder);
    nextOrderId++;

    return newOrder;
  }

  static async getById(id: string): Promise<Order | null> {
    return mockOrders.find(order => order.id === id) || null;
  }

  static async getByCustomerEmail(email: string): Promise<Order[]> {
    return mockOrders.filter(order => order.customer.email === email);
  }

  static async updateStatus(id: string, status: Order['status']): Promise<Order | null> {
    const order = mockOrders.find(order => order.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
    }
    return order || null;
  }

  static async getAll(filters?: {
    status?: Order['status'];
    page?: number;
    limit?: number;
  }): Promise<{
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    let orders = [...mockOrders];

    // Apply filters
    if (filters?.status) {
      orders = orders.filter(order => order.status === filters.status);
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedOrders = orders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: orders.length,
        totalPages: Math.ceil(orders.length / limit)
      }
    };
  }
}