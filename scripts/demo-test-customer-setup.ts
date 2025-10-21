#!/usr/bin/env npx tsx

/**
 * Demo Test Customer Setup (No AWS Required)
 * 
 * This script demonstrates the test customer setup without requiring AWS credentials.
 * It shows what would be created and validates the test structure.
 */

import { config } from 'dotenv'

// Load environment variables
config()

interface DemoTestData {
  customer: any
  businesses: any[]
  stalls: any[]
  products: any[]
  orders: any[]
}

async function demoTestCustomerSetup(): Promise<void> {
  console.log('🧪 Demo: Test Customer and Validation Setup...\n')
  console.log('📝 This demo shows what would be created in the actual test setup.\n')
  
  const testData: DemoTestData = {
    customer: null,
    businesses: [],
    stalls: [],
    products: [],
    orders: []
  }

  try {
    // Step 1: Demo test customer account
    console.log('1️⃣ Demo: Test customer account creation...')
    
    const testCustomerEmail = 'dangwenyi@emtechhouse.co.ke'
    const testCustomerName = 'Willie Macharia'
    const testCustomerPassword = 'TestCustomer123!'
    
    testData.customer = {
      id: 'customer_demo_12345',
      email: testCustomerEmail,
      name: testCustomerName,
      roles_json: JSON.stringify(['customer']),
      status: 'active',
      customer_preferences: {
        dietary_restrictions: ['halal'],
        favorite_stalls: [],
        default_delivery_address: '789 Test Avenue, Nairobi',
        notification_preferences: {
          email: true,
          sms: true,
          push: true
        }
      },
      customer_stats: {
        total_orders: 0,
        total_spent_cents: 0,
        favorite_products: []
      },
      created_at: new Date().toISOString()
    }
    
    console.log('   ✅ Demo customer created successfully')
    console.log(`   📧 Email: ${testCustomerEmail}`)
    console.log(`   👤 Name: ${testCustomerName}`)
    console.log(`   🔑 Password: ${testCustomerPassword}`)
    console.log(`   🆔 Customer ID: ${testData.customer.id}`)

    // Step 2: Demo sample businesses
    console.log('\n2️⃣ Demo: Sample businesses creation...')
    
    const sampleBusinesses = [
      {
        id: 'biz_demo_nairobi_food_court',
        name: 'Nairobi Food Court',
        description: 'Premium food court with diverse cuisine options',
        address: '123 Kimathi Street, Nairobi CBD',
        phone: '+254700123456',
        email: 'manager@nairobifoodcourt.co.ke',
        owner_user_id: 'user_demo_sarah_wanjiku',
        status: 'active',
        settings_json: JSON.stringify({
          currency: 'KES',
          timezone: 'Africa/Nairobi'
        })
      },
      {
        id: 'biz_demo_westlands_eatery',
        name: 'Westlands Eatery Hub',
        description: 'Modern eatery hub serving fresh, healthy meals',
        address: '456 Waiyaki Way, Westlands',
        phone: '+254700789012',
        email: 'info@westlandseatery.co.ke',
        owner_user_id: 'user_demo_john_kamau',
        status: 'active',
        settings_json: JSON.stringify({
          currency: 'KES',
          timezone: 'Africa/Nairobi'
        })
      }
    ]

    testData.businesses = sampleBusinesses
    sampleBusinesses.forEach(business => {
      console.log(`   ✅ Demo business: ${business.name} (ID: ${business.id})`)
    })

    // Step 3: Demo sample stalls
    console.log('\n3️⃣ Demo: Sample stalls creation...')
    
    const sampleStalls = [
      {
        id: 'stall_demo_mama_njeri',
        business_id: testData.businesses[0].id,
        name: 'Mama Njeri\'s Kitchen',
        description: 'Authentic Kenyan cuisine with traditional flavors',
        pickup_address: 'Stall 1A, Nairobi Food Court',
        cuisine_type: 'Kenyan Traditional',
        capacity_per_day: 50,
        status: 'active',
        open_hours_json: JSON.stringify({
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '18:00' },
          saturday: { open: '09:00', close: '16:00' },
          sunday: { closed: true }
        })
      },
      {
        id: 'stall_demo_spice_route',
        business_id: testData.businesses[0].id,
        name: 'Spice Route Indian',
        description: 'Authentic Indian cuisine with aromatic spices',
        pickup_address: 'Stall 2B, Nairobi Food Court',
        cuisine_type: 'Indian',
        capacity_per_day: 40,
        status: 'active',
        open_hours_json: JSON.stringify({
          monday: { open: '11:00', close: '21:00' },
          tuesday: { open: '11:00', close: '21:00' },
          wednesday: { open: '11:00', close: '21:00' },
          thursday: { open: '11:00', close: '21:00' },
          friday: { open: '11:00', close: '22:00' },
          saturday: { open: '11:00', close: '22:00' },
          sunday: { open: '12:00', close: '20:00' }
        })
      },
      {
        id: 'stall_demo_fresh_salad',
        business_id: testData.businesses[1].id,
        name: 'Fresh Salad Bar',
        description: 'Healthy salads and fresh juices',
        pickup_address: 'Counter 1, Westlands Eatery Hub',
        cuisine_type: 'Healthy/Salads',
        capacity_per_day: 60,
        status: 'active',
        open_hours_json: JSON.stringify({
          monday: { open: '07:00', close: '17:00' },
          tuesday: { open: '07:00', close: '17:00' },
          wednesday: { open: '07:00', close: '17:00' },
          thursday: { open: '07:00', close: '17:00' },
          friday: { open: '07:00', close: '17:00' },
          saturday: { open: '08:00', close: '15:00' },
          sunday: { closed: true }
        })
      },
      {
        id: 'stall_demo_burger_junction',
        business_id: testData.businesses[1].id,
        name: 'Burger Junction',
        description: 'Gourmet burgers and crispy fries',
        pickup_address: 'Counter 2, Westlands Eatery Hub',
        cuisine_type: 'Fast Food',
        capacity_per_day: 80,
        status: 'active',
        open_hours_json: JSON.stringify({
          monday: { open: '10:00', close: '22:00' },
          tuesday: { open: '10:00', close: '22:00' },
          wednesday: { open: '10:00', close: '22:00' },
          thursday: { open: '10:00', close: '22:00' },
          friday: { open: '10:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '11:00', close: '21:00' }
        })
      }
    ]

    testData.stalls = sampleStalls
    sampleStalls.forEach(stall => {
      console.log(`   ✅ Demo stall: ${stall.name} (ID: ${stall.id})`)
    })

    // Step 4: Demo sample products
    console.log('\n4️⃣ Demo: Sample products creation...')
    
    const sampleProducts = [
      {
        id: 'prod_demo_nyama_choma',
        stall_id: testData.stalls[0].id,
        business_id: testData.stalls[0].business_id,
        title: 'Nyama Choma with Ugali',
        short_desc: 'Grilled beef with traditional ugali',
        long_desc: 'Tender grilled beef served with fresh ugali, sukuma wiki, and traditional tomato sauce',
        price_cents: 85000, // 850 KES
        currency: 'KES',
        sku: 'MNK001',
        tags_csv: 'grilled,beef,traditional,ugali',
        diet_flags_csv: 'gluten-free-option',
        prep_time_minutes: 25,
        inventory_qty: 20,
        status: 'active'
      },
      {
        id: 'prod_demo_githeri',
        stall_id: testData.stalls[0].id,
        business_id: testData.stalls[0].business_id,
        title: 'Githeri Special',
        short_desc: 'Traditional mixed beans and maize',
        long_desc: 'Nutritious githeri cooked with vegetables, served with avocado and traditional accompaniments',
        price_cents: 45000, // 450 KES
        currency: 'KES',
        sku: 'MNK002',
        tags_csv: 'vegetarian,traditional,beans,healthy',
        diet_flags_csv: 'vegetarian,vegan-option',
        prep_time_minutes: 15,
        inventory_qty: 30,
        status: 'active'
      },
      {
        id: 'prod_demo_biryani',
        stall_id: testData.stalls[1].id,
        business_id: testData.stalls[1].business_id,
        title: 'Chicken Biryani',
        short_desc: 'Aromatic basmati rice with spiced chicken',
        long_desc: 'Fragrant basmati rice cooked with tender chicken pieces, aromatic spices, and served with raita',
        price_cents: 75000, // 750 KES
        currency: 'KES',
        sku: 'SRI001',
        tags_csv: 'chicken,rice,spicy,aromatic',
        diet_flags_csv: 'halal',
        prep_time_minutes: 30,
        inventory_qty: 25,
        status: 'active'
      },
      {
        id: 'prod_demo_paneer',
        stall_id: testData.stalls[1].id,
        business_id: testData.stalls[1].business_id,
        title: 'Paneer Butter Masala',
        short_desc: 'Creamy paneer curry with naan',
        long_desc: 'Rich and creamy paneer curry in tomato-based sauce, served with fresh naan bread',
        price_cents: 65000, // 650 KES
        currency: 'KES',
        sku: 'SRI002',
        tags_csv: 'vegetarian,paneer,curry,creamy',
        diet_flags_csv: 'vegetarian',
        prep_time_minutes: 20,
        inventory_qty: 20,
        status: 'active'
      },
      {
        id: 'prod_demo_quinoa_bowl',
        stall_id: testData.stalls[2].id,
        business_id: testData.stalls[2].business_id,
        title: 'Mediterranean Quinoa Bowl',
        short_desc: 'Healthy quinoa with fresh vegetables',
        long_desc: 'Nutritious quinoa bowl with cucumber, tomatoes, olives, feta cheese, and lemon dressing',
        price_cents: 55000, // 550 KES
        currency: 'KES',
        sku: 'FSB001',
        tags_csv: 'healthy,quinoa,mediterranean,fresh',
        diet_flags_csv: 'vegetarian,gluten-free',
        prep_time_minutes: 10,
        inventory_qty: 35,
        status: 'active'
      },
      {
        id: 'prod_demo_smoothie',
        stall_id: testData.stalls[2].id,
        business_id: testData.stalls[2].business_id,
        title: 'Green Detox Smoothie',
        short_desc: 'Fresh green smoothie with superfoods',
        long_desc: 'Energizing smoothie with spinach, kale, apple, banana, ginger, and chia seeds',
        price_cents: 35000, // 350 KES
        currency: 'KES',
        sku: 'FSB002',
        tags_csv: 'smoothie,detox,healthy,green',
        diet_flags_csv: 'vegan,gluten-free,dairy-free',
        prep_time_minutes: 5,
        inventory_qty: 50,
        status: 'active'
      },
      {
        id: 'prod_demo_burger',
        stall_id: testData.stalls[3].id,
        business_id: testData.stalls[3].business_id,
        title: 'Classic Beef Burger',
        short_desc: 'Juicy beef patty with classic toppings',
        long_desc: 'Quarter-pound beef patty with lettuce, tomato, onion, pickles, and special sauce on a sesame bun',
        price_cents: 60000, // 600 KES
        currency: 'KES',
        sku: 'BJ001',
        tags_csv: 'burger,beef,classic,juicy',
        diet_flags_csv: '',
        prep_time_minutes: 12,
        inventory_qty: 40,
        status: 'active'
      },
      {
        id: 'prod_demo_wings',
        stall_id: testData.stalls[3].id,
        business_id: testData.stalls[3].business_id,
        title: 'Crispy Chicken Wings',
        short_desc: 'Spicy chicken wings with dipping sauce',
        long_desc: 'Six pieces of crispy chicken wings tossed in buffalo sauce, served with ranch dipping sauce',
        price_cents: 50000, // 500 KES
        currency: 'KES',
        sku: 'BJ002',
        tags_csv: 'chicken,wings,spicy,crispy',
        diet_flags_csv: 'halal-option',
        prep_time_minutes: 15,
        inventory_qty: 30,
        status: 'active'
      }
    ]

    testData.products = sampleProducts
    sampleProducts.forEach(product => {
      console.log(`   ✅ Demo product: ${product.title} (${product.currency} ${(product.price_cents / 100).toFixed(2)})`)
    })

    // Step 5: Demo sample orders
    console.log('\n5️⃣ Demo: Sample orders creation...')
    
    const sampleOrders = [
      {
        id: 'order_demo_completed',
        customer_id: testData.customer.id,
        business_id: testData.businesses[0].id,
        stall_id: testData.stalls[0].id,
        status: 'completed',
        total_amount_cents: 85000,
        scheduled_for: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        items_json: JSON.stringify([
          {
            product_id: testData.products[0].id,
            quantity: 1,
            unit_price_cents: 85000,
            special_instructions: 'Medium spice level please'
          }
        ]),
        delivery_method: 'pickup',
        payment_status: 'paid'
      },
      {
        id: 'order_demo_confirmed',
        customer_id: testData.customer.id,
        business_id: testData.businesses[1].id,
        stall_id: testData.stalls[2].id,
        status: 'confirmed',
        total_amount_cents: 90000,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        items_json: JSON.stringify([
          {
            product_id: testData.products[4].id,
            quantity: 1,
            unit_price_cents: 55000,
            special_instructions: 'Extra dressing on the side'
          },
          {
            product_id: testData.products[5].id,
            quantity: 1,
            unit_price_cents: 35000,
            special_instructions: 'No ice please'
          }
        ]),
        delivery_method: 'pickup',
        payment_status: 'paid'
      },
      {
        id: 'order_demo_pending',
        customer_id: testData.customer.id,
        business_id: testData.businesses[0].id,
        stall_id: testData.stalls[1].id,
        status: 'pending',
        total_amount_cents: 140000,
        scheduled_for: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        items_json: JSON.stringify([
          {
            product_id: testData.products[2].id,
            quantity: 1,
            unit_price_cents: 75000,
            special_instructions: 'Mild spice level'
          },
          {
            product_id: testData.products[3].id,
            quantity: 1,
            unit_price_cents: 65000,
            special_instructions: 'Extra naan bread'
          }
        ]),
        delivery_method: 'pickup',
        payment_status: 'pending'
      }
    ]

    testData.orders = sampleOrders
    sampleOrders.forEach(order => {
      console.log(`   ✅ Demo order: ${order.id} (${order.status}, ${(order.total_amount_cents / 100).toFixed(2)} KES)`)
    })

    // Step 6: Demo cart items
    console.log('\n6️⃣ Demo: Customer cart items...')
    
    const cartItems = [
      {
        product_id: testData.products[6].id, // Classic Beef Burger
        stall_id: testData.stalls[3].id,
        quantity: 2,
        unit_price_cents: 60000,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        special_instructions: 'No pickles, extra cheese'
      },
      {
        product_id: testData.products[7].id, // Crispy Chicken Wings
        stall_id: testData.stalls[3].id,
        quantity: 1,
        unit_price_cents: 50000,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        special_instructions: 'Extra spicy sauce'
      }
    ]

    cartItems.forEach(item => {
      console.log(`   ✅ Demo cart item: ${item.quantity}x product ${item.product_id.substring(5, 15)}... (${(item.unit_price_cents / 100).toFixed(2)} KES each)`)
    })

    // Generate test summary
    console.log('\n🎉 Demo Test Customer and Validation Setup Complete!')
    console.log('\n📊 Demo Test Data Summary:')
    console.log(`   👤 Customer: ${testData.customer.name} (${testData.customer.email})`)
    console.log(`   🏢 Businesses: ${testData.businesses.length}`)
    console.log(`   🏪 Stalls: ${testData.stalls.length}`)
    console.log(`   🍽️  Products: ${testData.products.length}`)
    console.log(`   📦 Orders: ${testData.orders.length}`)
    console.log(`   🛒 Cart Items: ${cartItems.length}`)
    
    console.log('\n🔑 Demo Test Credentials:')
    console.log(`   Email: ${testData.customer.email}`)
    console.log(`   Password: TestCustomer123!`)
    
    console.log('\n🧪 Demo Test Scenarios Available:')
    console.log('   ✅ Customer signup and authentication')
    console.log('   ✅ Stall browsing and product discovery')
    console.log('   ✅ Shopping cart functionality')
    console.log('   ✅ Order placement and tracking')
    console.log('   ✅ Order history and status updates')
    console.log('   ✅ Customer preferences management')
    
    console.log('\n📋 Demo Business Data:')
    testData.businesses.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name}`)
      console.log(`      Address: ${business.address}`)
      console.log(`      Phone: ${business.phone}`)
      console.log(`      Email: ${business.email}`)
    })
    
    console.log('\n🏪 Demo Stall Data:')
    testData.stalls.forEach((stall, index) => {
      console.log(`   ${index + 1}. ${stall.name} (${stall.cuisine_type})`)
      console.log(`      Capacity: ${stall.capacity_per_day} orders/day`)
      console.log(`      Location: ${stall.pickup_address}`)
    })
    
    console.log('\n🍽️ Demo Product Data:')
    testData.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.title} - ${product.currency} ${(product.price_cents / 100).toFixed(2)}`)
      console.log(`      Description: ${product.short_desc}`)
      console.log(`      Prep Time: ${product.prep_time_minutes} minutes`)
      console.log(`      Inventory: ${product.inventory_qty} available`)
    })
    
    console.log('\n📦 Demo Order Data:')
    testData.orders.forEach((order, index) => {
      const items = JSON.parse(order.items_json)
      console.log(`   ${index + 1}. Order ${order.id.substring(6, 16)}... (${order.status})`)
      console.log(`      Total: ${order.currency || 'KES'} ${(order.total_amount_cents / 100).toFixed(2)}`)
      console.log(`      Items: ${items.length} products`)
      console.log(`      Scheduled: ${new Date(order.scheduled_for).toLocaleDateString()}`)
    })
    
    console.log('\n🚀 Next Steps (with AWS credentials):')
    console.log('   1. Configure AWS credentials in .env file')
    console.log('   2. Run: npm run create-dynamodb-tables')
    console.log('   3. Run: npm run create-test-customer')
    console.log('   4. Start development server: npm run dev')
    console.log('   5. Test customer journey: npm run test-customer-journey')
    console.log('   6. Validate data consistency: npm run validate-data-consistency')
    console.log('   7. Run complete test suite: npm run test-customer-suite')
    
    console.log('\n📖 Documentation:')
    console.log('   • All test scripts are in the scripts/ directory')
    console.log('   • Test data follows the customer ordering system requirements')
    console.log('   • Data structure matches DynamoDB schema')
    console.log('   • Test scenarios cover all customer journey steps')
    console.log('   • Validation scripts ensure data consistency')

  } catch (error) {
    console.error('❌ Demo setup failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    process.exit(1)
  }
}

// Run the demo
if (require.main === module) {
  demoTestCustomerSetup()
}

export { demoTestCustomerSetup }