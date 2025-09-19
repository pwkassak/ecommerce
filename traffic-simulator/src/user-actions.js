const logger = require('./logger');

class UserActions {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
    this.currentCart = [];
  }

  async navigateToHomePage() {
    logger.debug('Navigating to homepage');
    try {
      await this.page.goto(this.baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for the page to load completely and products to render
      // Products are loaded asynchronously by React
      try {
        // First wait for the loading state to appear, then disappear
        await this.page.waitForSelector('.featured-products', { timeout: 10000 });

        // Wait for either product cards to appear or "Loading" text to disappear
        await this.page.waitForFunction(() => {
          // Check if we have product cards
          const productCards = document.querySelectorAll('.product-card');
          if (productCards.length > 0) return true;

          // Or if loading text is gone (products failed to load)
          const loadingText = document.querySelector('.loading');
          return !loadingText || !loadingText.textContent.includes('Loading');
        }, { timeout: 15000 });

        // Wait for analytics to initialize
        await this.waitForAnalyticsInitialization();

        // Now check if we actually have products
        const productCount = await this.page.locator('.product-card').count();
        if (productCount > 0) {
          logger.debug(`Found ${productCount} product cards`);
        } else {
          logger.warn('No product cards found after waiting for page load');
        }
      } catch (e) {
        // Log the page title and body for debugging
        const title = await this.page.title();
        const bodyText = await this.page.locator('body').innerText().catch(() => 'Could not get body text');
        logger.warn(`Product cards not found. Page title: "${title}", Body preview: "${bodyText.substring(0, 200)}"`);

        // Try alternative selectors that might exist
        const alternatives = ['[class*="product"]', '[class*="card"]', 'main', '#root'];
        for (const selector of alternatives) {
          const exists = await this.page.locator(selector).count() > 0;
          if (exists) {
            logger.debug(`Found alternative selector: ${selector}`);
            return; // Continue anyway
          }
        }
      }
    } catch (error) {
      logger.error('Failed to navigate to homepage:', error);
      throw error;
    }
  }

  async browseProducts() {
    logger.debug('Browsing products');
    
    // Wait for products to load
    await this.page.waitForSelector('.product-card', { timeout: 5000 });
    
    // Get all product cards
    const productCards = await this.page.locator('.product-card').all();
    
    if (productCards.length === 0) {
      throw new Error('No products found');
    }

    // Scroll to random product to simulate browsing
    const randomIndex = Math.floor(Math.random() * Math.min(productCards.length, 5));
    await productCards[randomIndex].scrollIntoViewIfNeeded();
    
    // Small delay to simulate reading
    await this.sleep(1000 + Math.random() * 2000);
  }

  async viewProductDetail() {
    logger.debug('Viewing product detail');
    
    // Find all product links
    const productLinks = await this.page.locator('.product-card .product-link').all();
    
    if (productLinks.length === 0) {
      throw new Error('No product links found');
    }

    // Click random product
    const randomLink = productLinks[Math.floor(Math.random() * productLinks.length)];
    await randomLink.click();
    
    // Wait for product detail page to load
    await this.page.waitForSelector('.product-detail', { timeout: 5000 });
    
    // Simulate reading product details
    await this.sleep(2000 + Math.random() * 3000);
  }

  async addToCart() {
    logger.debug('Adding item to cart');
    
    try {
      // Try to find add to cart button (works on both product cards and detail pages)
      const addToCartBtn = this.page.locator('.add-to-cart').first();
      
      // Check if button exists and is enabled
      await addToCartBtn.waitFor({ state: 'visible', timeout: 3000 });
      
      if (await addToCartBtn.isEnabled()) {
        // On product detail page, optionally change quantity
        const quantityInput = this.page.locator('#quantity');
        if (await quantityInput.isVisible()) {
          const randomQuantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
          await quantityInput.fill(randomQuantity.toString());
        }
        
        await addToCartBtn.click();

        // Wait for cart count to update
        await this.page.waitForSelector('.cart-count', { timeout: 3000 });

        // Wait for analytics event to be tracked and potentially flushed
        await this.waitForAnalyticsFlush();

        logger.debug('Item added to cart successfully');
      } else {
        throw new Error('Add to cart button is disabled');
      }
    } catch (error) {
      throw new Error(`Failed to add to cart: ${error.message}`);
    }
  }

  async viewCart() {
    logger.debug('Viewing cart');
    
    // Click cart link
    await this.page.click('.cart-link');
    
    // Wait for cart page to load
    await this.page.waitForLoadState('networkidle');
    
    // Check if we're on cart page
    if (!this.page.url().includes('/cart')) {
      throw new Error('Failed to navigate to cart page');
    }
    
    // Simulate looking at cart contents
    await this.sleep(1000 + Math.random() * 2000);
  }

  async updateCartQuantity() {
    logger.debug('Updating cart quantity');
    
    // Must be on cart page
    if (!this.page.url().includes('/cart')) {
      await this.viewCart();
    }
    
    // Check if cart has items
    const cartItems = await this.page.locator('.cart-item').all();
    
    if (cartItems.length === 0) {
      throw new Error('Cart is empty, cannot update quantity');
    }
    
    // Randomly increase or decrease quantity
    const action = Math.random() > 0.5 ? 'increase' : 'decrease';
    const selector = action === 'increase' ? '.quantity-btn:last-child' : '.quantity-btn:first-child';
    
    try {
      await this.page.click(selector);
      
      // Wait a moment for update
      await this.sleep(500);
      
      logger.debug(`Cart quantity ${action}d`);
    } catch (error) {
      throw new Error(`Failed to update quantity: ${error.message}`);
    }
  }

  async navigateToCategory() {
    logger.debug('Navigating to category');
    
    // Try to find category links in navigation
    const categoryLinks = await this.page.locator('nav a[href^="/categories/"]').all();
    
    if (categoryLinks.length === 0) {
      // Fall back to homepage if no categories found
      await this.navigateToHomePage();
      return;
    }
    
    // Click random category
    const randomCategory = categoryLinks[Math.floor(Math.random() * categoryLinks.length)];
    await randomCategory.click();
    
    // Wait for page to load
    await this.page.waitForLoadState('networkidle');
    
    // Simulate browsing category
    await this.sleep(1000 + Math.random() * 2000);
  }

  async proceedToCheckout() {
    logger.debug('Proceeding to checkout');
    
    // Must be on cart page with items
    if (!this.page.url().includes('/cart')) {
      await this.viewCart();
    }
    
    // Check if cart has items
    const cartItems = await this.page.locator('.cart-item').all();
    
    if (cartItems.length === 0) {
      throw new Error('Cart is empty, cannot checkout');
    }
    
    // Click checkout button
    const checkoutBtn = this.page.locator('.checkout-btn');
    await checkoutBtn.waitFor({ state: 'visible', timeout: 3000 });
    await checkoutBtn.click();
    
    // Wait for checkout page
    await this.page.waitForLoadState('networkidle');
    
    if (!this.page.url().includes('/checkout')) {
      throw new Error('Failed to navigate to checkout page');
    }
    
    logger.debug('Reached checkout page');
  }

  async completeCheckout() {
    logger.debug('Completing checkout');
    
    // Must be on checkout page
    if (!this.page.url().includes('/checkout')) {
      await this.proceedToCheckout();
    }
    
    try {
      // Fill in checkout form with fake data
      await this.fillCheckoutForm();
      
      // Submit checkout
      const submitBtn = this.page.locator('button[type="submit"], .complete-order');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        
        // Wait for order success page
        await this.page.waitForLoadState('networkidle');
        
        if (this.page.url().includes('/order-success')) {
          logger.debug('Checkout completed successfully');
        } else {
          logger.debug('Checkout submitted (may have validation errors)');
        }
      }
    } catch (error) {
      throw new Error(`Checkout failed: ${error.message}`);
    }
  }

  async fillCheckoutForm() {
    // Fill common form fields with fake data
    const formData = {
      'input[name="email"], #email': 'test@example.com',
      'input[name="firstName"], #firstName': 'John',
      'input[name="lastName"], #lastName': 'Doe',
      'input[name="address"], #address': '123 Main St',
      'input[name="city"], #city': 'Anytown',
      'input[name="zipCode"], #zipCode': '12345',
      'input[name="phone"], #phone': '555-0123',
      'input[name="cardNumber"], #cardNumber': '4111111111111111',
      'input[name="expiryDate"], #expiryDate': '12/25',
      'input[name="cvv"], #cvv': '123'
    };

    for (const [selector, value] of Object.entries(formData)) {
      try {
        const field = this.page.locator(selector);
        if (await field.isVisible()) {
          await field.fill(value);
        }
      } catch (error) {
        // Continue if field doesn't exist
      }
    }
    
    // Small delay after filling form
    await this.sleep(500);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to simulate human-like random delays
  async randomDelay(min = 500, max = 2000) {
    const delay = Math.random() * (max - min) + min;
    await this.sleep(delay);
  }

  // Wait for analytics system to initialize
  async waitForAnalyticsInitialization() {
    try {
      await this.page.waitForFunction(() => {
        // Check if analytics manager is initialized
        return window.analyticsManager ||
               document.querySelector('[data-analytics-ready]') ||
               localStorage.getItem('analytics_anonymous_id');
      }, { timeout: 5000 });

      logger.debug('Analytics system initialized');
    } catch (error) {
      logger.warn('Analytics initialization timeout - continuing anyway');
    }
  }

  // Wait for analytics events to be flushed (5 second interval)
  async waitForAnalyticsFlush() {
    // Wait a bit longer than the flush interval to ensure events are sent
    await this.sleep(6000);
    logger.debug('Analytics flush wait completed');
  }
}

module.exports = UserActions;