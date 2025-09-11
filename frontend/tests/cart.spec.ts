import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
    
    // Wait for the page to load and products to be visible
    await page.waitForSelector('.product-card', { timeout: 10000 });
  });

  test('should display cart icon with zero items initially', async ({ page }) => {
    // Check that cart icon exists
    const cartLink = page.locator('.cart-link');
    await expect(cartLink).toBeVisible();
    
    // Check that cart count is not visible (no items)
    const cartCount = page.locator('.cart-count');
    await expect(cartCount).not.toBeVisible();
  });

  test('should add item to cart from product card', async ({ page }) => {
    // Find the first available product card with "Add to Cart" button
    const firstProductCard = page.locator('.product-card').first();
    const addToCartBtn = firstProductCard.locator('.add-to-cart');
    
    // Wait for the button to be enabled (not disabled due to out of stock)
    await expect(addToCartBtn).toBeEnabled();
    
    // Get product name for verification
    const productName = await firstProductCard.locator('.product-name').textContent();
    console.log('🔍 Testing add to cart for product:', productName);
    
    // Click add to cart button
    await addToCartBtn.click();
    
    // Check that cart count appears and shows 1
    const cartCount = page.locator('.cart-count');
    await expect(cartCount).toBeVisible();
    await expect(cartCount).toHaveText('1');
  });

  test('should navigate to cart page and display added items', async ({ page }) => {
    // Add an item to cart first
    const firstProductCard = page.locator('.product-card').first();
    const addToCartBtn = firstProductCard.locator('.add-to-cart');
    const productName = await firstProductCard.locator('.product-name').textContent();
    const productPrice = await firstProductCard.locator('.product-price').textContent();
    
    await addToCartBtn.click();
    
    // Wait for cart count to update
    await expect(page.locator('.cart-count')).toHaveText('1');
    
    // Navigate to cart page
    await page.click('.cart-link');
    await expect(page).toHaveURL('/cart');
    
    // Check that cart page shows the added item
    await expect(page.locator('.cart-item')).toHaveCount(1);
    await expect(page.locator('.item-name')).toContainText(productName || '');
    
    // Check that cart summary shows correct totals
    const subtotal = page.locator('.summary-row').filter({ hasText: 'Subtotal:' });
    await expect(subtotal).toBeVisible();
  });

  test('should update item quantity in cart', async ({ page }) => {
    // Add an item to cart
    const addToCartBtn = page.locator('.product-card').first().locator('.add-to-cart');
    await addToCartBtn.click();
    
    // Navigate to cart
    await page.click('.cart-link');
    
    // Increase quantity using + button
    const increaseBtn = page.locator('.quantity-btn').last();
    await increaseBtn.click();
    
    // Check that quantity input shows 2
    const quantityInput = page.locator('.quantity-input');
    await expect(quantityInput).toHaveValue('2');
    
    // Check that cart count in navigation updated
    await page.goBack();
    const cartCount = page.locator('.cart-count');
    await expect(cartCount).toHaveText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    // Add an item to cart
    const addToCartBtn = page.locator('.product-card').first().locator('.add-to-cart');
    await addToCartBtn.click();
    
    // Navigate to cart
    await page.click('.cart-link');
    
    // Remove the item
    const removeBtn = page.locator('.remove-item');
    await removeBtn.click();
    
    // Check that cart is now empty
    await expect(page.locator('.empty-cart')).toBeVisible();
    await expect(page.locator('.empty-cart h2')).toHaveText('Your cart is empty');
  });

  test('should clear entire cart', async ({ page }) => {
    // Add multiple items to cart
    const addToCartBtns = page.locator('.add-to-cart').first();
    await addToCartBtns.click();
    await addToCartBtns.click(); // Add same item twice
    
    // Navigate to cart
    await page.click('.cart-link');
    
    // Clear cart
    const clearCartBtn = page.locator('.clear-cart');
    await clearCartBtn.click();
    
    // Check that cart is empty
    await expect(page.locator('.empty-cart')).toBeVisible();
  });

  test('should calculate correct totals including tax', async ({ page }) => {
    // Add an item to cart
    const firstProductCard = page.locator('.product-card').first();
    const productPriceText = await firstProductCard.locator('.product-price').textContent();
    const productPrice = parseFloat(productPriceText?.replace('$', '') || '0');
    
    const addToCartBtn = firstProductCard.locator('.add-to-cart');
    await addToCartBtn.click();
    
    // Navigate to cart
    await page.click('.cart-link');
    
    // Check subtotal matches product price
    const subtotalElement = page.locator('.summary-row').filter({ hasText: 'Subtotal:' }).locator('span').last();
    const subtotalText = await subtotalElement.textContent();
    const subtotal = parseFloat(subtotalText?.replace('$', '') || '0');
    expect(subtotal).toBe(productPrice);
    
    // Check tax calculation (8%)
    const taxElement = page.locator('.summary-row').filter({ hasText: 'Tax' }).locator('span').last();
    const taxText = await taxElement.textContent();
    const tax = parseFloat(taxText?.replace('$', '') || '0');
    expect(tax).toBeCloseTo(productPrice * 0.08, 2);
    
    // Check total (subtotal + tax)
    const totalElement = page.locator('.summary-row.total').locator('span').last();
    const totalText = await totalElement.textContent();
    const total = parseFloat(totalText?.replace('$', '') || '0');
    expect(total).toBeCloseTo(productPrice * 1.08, 2);
  });

  test('should navigate to checkout from cart', async ({ page }) => {
    // Add an item to cart
    const addToCartBtn = page.locator('.product-card').first().locator('.add-to-cart');
    await addToCartBtn.click();
    
    // Navigate to cart
    await page.click('.cart-link');
    
    // Click checkout button
    const checkoutBtn = page.locator('.checkout-btn');
    await checkoutBtn.click();
    
    // Should navigate to checkout page
    await expect(page).toHaveURL('/checkout');
  });

  test('should continue shopping from empty cart', async ({ page }) => {
    // Navigate directly to cart (should be empty)
    await page.goto('/cart');
    
    // Check empty cart state
    await expect(page.locator('.empty-cart')).toBeVisible();
    
    // Click continue shopping
    const continueShoppingBtn = page.locator('text=Continue Shopping');
    await continueShoppingBtn.click();
    
    // Should return to homepage
    await expect(page).toHaveURL('/');
    await expect(page.locator('.product-card').first()).toBeVisible();
  });

  test('should add item from product detail page', async ({ page }) => {
    // Click on first product to go to detail page
    const firstProductCard = page.locator('.product-card').first();
    const productLink = firstProductCard.locator('.product-link');
    await productLink.click();
    
    // Should be on product detail page
    await expect(page.url()).toContain('/products/');
    
    // Set quantity to 2
    const quantityInput = page.locator('#quantity');
    await quantityInput.fill('2');
    
    // Click add to cart
    const addToCartBtn = page.locator('.add-to-cart');
    await addToCartBtn.click();
    
    // Check that cart count shows 2 items
    const cartCount = page.locator('.cart-count');
    await expect(cartCount).toHaveText('2');
  });

  test('should use buy now functionality', async ({ page }) => {
    // Click on first product to go to detail page
    const firstProductCard = page.locator('.product-card').first();
    const productLink = firstProductCard.locator('.product-link');
    await productLink.click();
    
    // Click buy now button
    const buyNowBtn = page.locator('.buy-now');
    await buyNowBtn.click();
    
    // Should navigate directly to cart page
    await expect(page).toHaveURL('/cart');
    
    // Should show the item in cart
    await expect(page.locator('.cart-item')).toHaveCount(1);
  });
});