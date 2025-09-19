const { chromium } = require('playwright');

async function testAnalytics() {
  console.log('🚀 Starting analytics test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the home page
    console.log('📱 Navigating to home page...');
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);

    // Navigate to a product page
    console.log('🛍️ Clicking on a product...');
    await page.click('text=GAN 356 M 3x3 Speed Cube');
    await page.waitForTimeout(2000);

    // Add to cart
    console.log('🛒 Adding product to cart...');
    await page.click('text=Add to Cart');
    await page.waitForTimeout(2000);

    // Navigate back to home
    console.log('🏠 Going back to home...');
    await page.goto('http://localhost:3002');
    await page.waitForTimeout(2000);

    // Browse to another product
    console.log('🧩 Browsing to another product...');
    await page.click('text=QiYi Valk 3 Elite M');
    await page.waitForTimeout(2000);

    // Navigate to categories
    console.log('📂 Browsing categories...');
    await page.goto('http://localhost:3002/categories/speed-cubes');
    await page.waitForTimeout(2000);

    console.log('✅ Analytics test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during analytics test:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAnalytics().catch(console.error);