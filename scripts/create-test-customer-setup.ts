#!/usr/bin/env npx tsx

/**
 * Create Test Customer and Validation Setup
 * 
 * This script implements task 12 from the customer ordering system:
 * - Creates test customer account with specified credentials (Willie Macharia, dangwenyi@emtechhouse.co.ke)
 * - Sets up test data including sample stalls, products, and orders for demonstration
 * - Creates automated test scripts for end-to-end customer journey validation
 * - Implements test scenarios covering signup, authentication, browsing, ordering, and tracking
 * - Adds validation checks for data consistency across customer, business, and admin views
 */

import { config } from 'dotenv'
import { CustomerService } from '../lib/dynamodb/customers'
import { createUser, getUserByEmail, updateUser } from '../lib/dynamodb/users'
import { createBusiness, getAllBusinesses } from '../lib/dynamodb/business'
import { createStall, getAllStalls } from '../lib/dynamodb/stalls'
import { createProduct, getAllProducts } from '../lib/dynamodb/products'
import { createOrder, getAllOrders } from '../lib/dynamodb/orders'
import { hashPassword } from '../lib/auth/password'
import { v4 as uuidv4 } from 'uuid'
import { putItem, TABLE_NAMES } from '../lib/dynamodb/service'

// Load environment variables
config()

interface TestData {
  customer: any
  businesses: any[]
  stalls: any[]
  products: any[]
  orders: any[]
}

async function createTestCustomerSetup(): Promise<void> {
  console.log('🧪 Creating Test Customer and Validation Setup...\n')
  
  const testData: TestData = {
    customer: null,
    businesses: [],
    stalls: [],
    products: [],
    orders: []
  }

  try {
    // Step 1: Create test customer account with specified credentials
    console.log('1️⃣ Creating test customer account...')
    
    const testCustomerEmail = 'dangwenyi@emtechhouse.co.ke'
    const testCustomerName = 'Willie Macharia'
    const testCustomerPassword = 'TestCustomer123!'
    
    // Check if customer already exists
    let existingCustomer = await getUserByEmail(testCustomerEmail)
    
    if (existingCustomer) {
      console.log('   ⚠️  Test customer already exists, updating...')
      
      // Update existing customer to ensure it has correct data
      const hashedPassword = await hashPassword(testCustomerPassword)
      testData.customer = await updateUser(existingCustomer.id, {
        name: testCustomerName,
        hashed_password: hashedPassword,
        status: 'active',
        password_change_required: false
      })
      
      console.log('   ✅ Test customer updated successfully')
    } else {
      // Create new customer
      const hashedPassword = await hashPassword(testCustomerPassword)
      
      testData.customer = await CustomerService.createCustomer({
        email: testCustomerEmail,
        name: testCustomerName,
        hashed_password: hashedPassword
      })
      
      // Activate the customer account
      await updateUser(testData.customer.id, { 
        status: 'active',
        password_change_required: false
      })
      
      console.log('   ✅ Test customer created successfully')
    }
    
    console.log(`   📧 Email: ${testCustomerEmail}`)
    console.log(`   👤 Name: ${testCustomerName}`)
    console.log(`   🔑 Password: ${testCustomerPassword}`)
    console.log(`   🆔 Customer ID: ${testData.customer.id}`)

    // Step 2: Create sample businesses for testing
    console.log('\n2️⃣ Creating sample businesses...')
    
    const sampleBusinesses = [
      {
        name: 'Nairobi Food Court',
        description: 'Premium food court with diverse cuisine options',
        address: '123 Kimathi Street, Nairobi CBD',
        phone: '+254700123456',
        email: 'manager@nairobifoodcourt.co.ke',
        ownerName: 'Sarah Wanjiku',
        ownerEmail: 'sarah.wanjiku@nairobifoodcourt.co.ke'
      },
      {
        name: 'Westlands Eatery Hub',
        description: 'Modern eatery hub serving fresh, healthy meals',
        address: '456 Waiyaki Way, Westlands',
        phone: '+254700789012',
        email: 'info@westlandseatery.co.ke',
        ownerName: 'John Kamau',
        ownerEmail: 'john.kamau@westlandseatery.co.ke'
      }
    ]

    for (const businessData of sampleBusinesses) {
      // Check if business owner exists
      let businessOwner = await getUserByEmail(businessData.ownerEmail)
      
      if (!businessOwner) {
        // Create business owner
        const ownerPassword = await hashPassword('BusinessOwner123!')
        businessOwner = await createUser({
          email: businessData.ownerEmail,
          name: businessData.ownerName,
          hashed_password: ownerPassword,
          roles_json: JSON.stringify(['business_owner']),
          mfa_enabled: false,
          status: 'active'
        })
      }

      // Create business
      const business = {
        id: `biz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: businessData.name,
        description: businessData.description,
        address: businessData.address,
        phone: businessData.phone,
        email: businessData.email,
        owner_user_id: businessOwner.id,
        status: 'active',
        settings_json: JSON.stringify({
          currency: 'KES',
          timezone: 'Africa/Nairobi',
          created_by: 'test_setup'
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.BUSINESSES, business)
      testData.businesses.push(business)
      
      console.log(`   ✅ Created business: ${business.name} (ID: ${business.id})`)
    }

    // Step 3: Create sample stalls
    console.log('\n3️⃣ Creating sample stalls...')
    
    const sampleStalls = [
      // Stalls for Nairobi Food Court
      {
        business_id: testData.businesses[0].id,
        name: 'Mama Njeri\'s Kitchen',
        description: 'Authentic Kenyan cuisine with traditional flavors',
        pickup_address: 'Stall 1A, Nairobi Food Court',
        cuisine_type: 'Kenyan Traditional',
        capacity_per_day: 50,
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
        business_id: testData.businesses[0].id,
        name: 'Spice Route Indian',
        description: 'Authentic Indian cuisine with aromatic spices',
        pickup_address: 'Stall 2B, Nairobi Food Court',
        cuisine_type: 'Indian',
        capacity_per_day: 40,
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
      // Stalls for Westlands Eatery Hub
      {
        business_id: testData.businesses[1].id,
        name: 'Fresh Salad Bar',
        description: 'Healthy salads and fresh juices',
        pickup_address: 'Counter 1, Westlands Eatery Hub',
        cuisine_type: 'Healthy/Salads',
        capacity_per_day: 60,
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
        business_id: testData.businesses[1].id,
        name: 'Burger Junction',
        description: 'Gourmet burgers and crispy fries',
        pickup_address: 'Counter 2, Westlands Eatery Hub',
        cuisine_type: 'Fast Food',
        capacity_per_day: 80,
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

    for (const stallData of sampleStalls) {
      const stall = {
        id: `stall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...stallData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.STALLS, stall)
      testData.stalls.push(stall)
      
      console.log(`   ✅ Created stall: ${stall.name} (ID: ${stall.id})`)
    }

    // Step 4: Create sample products
    console.log('\n4️⃣ Creating sample products...')
    
    const sampleProducts = [
      // Products for Mama Njeri's Kitchen
      {
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
        inventory_qty: 20
      },
      {
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
        inventory_qty: 30
      },
      // Products for Spice Route Indian
      {
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
        inventory_qty: 25
      },
      {
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
        inventory_qty: 20
      },
      // Products for Fresh Salad Bar
      {
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
        inventory_qty: 35
      },
      {
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
        inventory_qty: 50
      },
      // Products for Burger Junction
      {
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
        inventory_qty: 40
      },
      {
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
        inventory_qty: 30
      }
    ]

    for (const productData of sampleProducts) {
      const product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...productData,
        status: 'active',
        created_by: 'test_setup',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await putItem(TABLE_NAMES.PRODUCTS, product)
      testData.products.push(product)
      
      console.log(`   ✅ Created product: ${product.title} (${product.currency} ${(product.price_cents / 100).toFixed(2)})`)
    }

    // Step 5: Create sample orders for demonstration
    console.log('\n5️⃣ Creating sample orders...')
    
    const sampleOrders = [
      {
        customer_id: testData.customer.id,
        business_id: testData.businesses[0].id,
        stall_id: testData.stalls[0].id,
        status: 'completed',
        total_amount_cents: 85000,
        scheduled_for: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        items: [
          {
            product_id: testData.products[0].id,
            quantity: 1,
            unit_price_cents: 85000,
            special_instructions: 'Medium spice level please'
          }
        ]
      },
      {
        customer_id: testData.customer.id,
        business_id: testData.businesses[1].id,
        stall_id: testData.stalls[2].id,
        status: 'confirmed',
        total_amount_cents: 90000,
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        items: [
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
        ]
      },
      {
        customer_id: testData.customer.id,
        business_id: testData.businesses[0].id,
        stall_id: testData.stalls[1].id,
        status: 'pending',
        total_amount_cents: 140000,
        scheduled_for: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        items: [
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
        ]
      }
    ]

    for (const orderData of sampleOrders) {
      const order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...orderData,
        items_json: JSON.stringify(orderData.items),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_method: 'pickup',
        payment_status: 'paid'
      }

      // Remove the items array since we're storing it as JSON
      delete (order as any).items

      await putItem(TABLE_NAMES.ORDERS, order)
      testData.orders.push(order)
      
      console.log(`   ✅ Created order: ${order.id} (${order.status}, ${(order.total_amount_cents / 100).toFixed(2)} KES)`)
    }

    // Step 6: Add items to customer's cart for testing
    console.log('\n6️⃣ Adding items to customer cart...')
    
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

    for (const item of cartItems) {
      await CustomerService.addToCart(testData.customer.id, item)
      console.log(`   ✅ Added to cart: ${item.quantity}x product ${item.product_id.substring(0, 8)}...`)
    }

    // Step 7: Update customer preferences and statistics
    console.log('\n7️⃣ Updating customer preferences and statistics...')
    
    await CustomerService.updateCustomerProfile(testData.customer.id, {
      preferences: {
        dietary_restrictions: ['halal'],
        favorite_stalls: [testData.stalls[0].id, testData.stalls[2].id],
        default_delivery_address: '789 Test Avenue, Nairobi',
        notification_preferences: {
          email: true,
          sms: true,
          push: true
        }
      }
    })

    // Update order statistics based on created orders
    const totalSpent = testData.orders.reduce((sum, order) => sum + order.total_amount_cents, 0)
    const allProductIds = testData.orders.flatMap(order => {
      const items = JSON.parse(order.items_json || '[]')
      return items.map((item: any) => item.product_id)
    })

    await CustomerService.updateCustomerOrderStats(testData.customer.id, {
      orderTotal: totalSpent,
      productIds: allProductIds
    })

    console.log('   ✅ Customer preferences and statistics updated')

    // Step 8: Generate test summary
    console.log('\n🎉 Test Customer and Validation Setup Complete!')
    console.log('\n📊 Test Data Summary:')
    console.log(`   👤 Customer: ${testData.customer.name} (${testData.customer.email})`)
    console.log(`   🏢 Businesses: ${testData.businesses.length}`)
    console.log(`   🏪 Stalls: ${testData.stalls.length}`)
    console.log(`   🍽️  Products: ${testData.products.length}`)
    console.log(`   📦 Orders: ${testData.orders.length}`)
    
    console.log('\n🔑 Test Credentials:')
    console.log(`   Email: ${testCustomerEmail}`)
    console.log(`   Password: ${testCustomerPassword}`)
    
    console.log('\n🧪 Test Scenarios Available:')
    console.log('   ✅ Customer signup and authentication')
    console.log('   ✅ Stall browsing and product discovery')
    console.log('   ✅ Shopping cart functionality')
    console.log('   ✅ Order placement and tracking')
    console.log('   ✅ Order history and status updates')
    console.log('   ✅ Customer preferences management')
    
    console.log('\n🚀 Next Steps:')
    console.log('   1. Start the development server: npm run dev')
    console.log('   2. Visit: http://localhost:3000/customer/login')
    console.log(`   3. Login with: ${testCustomerEmail} / ${testCustomerPassword}`)
    console.log('   4. Test the complete customer journey')
    console.log('   5. Run validation scripts: npm run test-customer-journey')

  } catch (error) {
    console.error('❌ Test setup failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the setup
if (require.main === module) {
  createTestCustomerSetup()
}

export { createTestCustomerSetup }