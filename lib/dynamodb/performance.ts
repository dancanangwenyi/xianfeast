import { dynamoClient, TABLE_NAMES } from './client'
import { 
  QueryCommand, 
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand
} from '@aws-sdk/lib-dynamodb'

/**
 * Performance optimization utilities for DynamoDB operations
 */

// Query optimization with proper indexing
export class OptimizedQueries {
  
  /**
   * Optimized customer order queries using GSI
   */
  static async getCustomerOrdersOptimized(
    customerId: string,
    options: {
      status?: string
      limit?: number
      lastEvaluatedKey?: any
      sortOrder?: 'asc' | 'desc'
    } = {}
  ) {
    const { status, limit = 20, lastEvaluatedKey, sortOrder = 'desc' } = options

    const command = new QueryCommand({
      TableName: TABLE_NAMES.ORDERS,
      IndexName: 'customer-user-id-index',
      KeyConditionExpression: 'customer_user_id = :customer_id',
      FilterExpression: status ? '#status = :status' : undefined,
      ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
      ExpressionAttributeValues: {
        ':customer_id': customerId,
        ...(status && { ':status': status })
      },
      ScanIndexForward: sortOrder === 'asc',
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    })

    return await dynamoClient.send(command)
  }

  /**
   * Optimized stall products query with filtering
   */
  static async getStallProductsOptimized(
    stallId: string,
    options: {
      status?: string
      priceRange?: { min: number; max: number }
      limit?: number
      lastEvaluatedKey?: any
    } = {}
  ) {
    const { status = 'active', priceRange, limit = 50, lastEvaluatedKey } = options

    let filterExpression = '#status = :status'
    const expressionAttributeNames = { '#status': 'status' }
    const expressionAttributeValues: any = { 
      ':stall_id': stallId,
      ':status': status 
    }

    if (priceRange) {
      filterExpression += ' AND price_cents BETWEEN :min_price AND :max_price'
      expressionAttributeValues[':min_price'] = priceRange.min
      expressionAttributeValues[':max_price'] = priceRange.max
    }

    const command = new QueryCommand({
      TableName: TABLE_NAMES.PRODUCTS,
      IndexName: 'stall-id-index',
      KeyConditionExpression: 'stall_id = :stall_id',
      FilterExpression: filterExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    })

    return await dynamoClient.send(command)
  }

  /**
   * Batch get operations for better performance
   */
  static async batchGetProducts(productIds: string[]) {
    if (productIds.length === 0) return []

    // DynamoDB batch get limit is 100 items
    const batches = []
    for (let i = 0; i < productIds.length; i += 100) {
      batches.push(productIds.slice(i, i + 100))
    }

    const results = []
    for (const batch of batches) {
      const command = new BatchGetCommand({
        RequestItems: {
          [TABLE_NAMES.PRODUCTS]: {
            Keys: batch.map(id => ({ id }))
          }
        }
      })

      const result = await dynamoClient.send(command)
      if (result.Responses?.[TABLE_NAMES.PRODUCTS]) {
        results.push(...result.Responses[TABLE_NAMES.PRODUCTS])
      }
    }

    return results
  }

  /**
   * Optimized order items query with batch operations
   */
  static async getOrderItemsBatch(orderIds: string[]) {
    if (orderIds.length === 0) return []

    const results = []
    
    // Use parallel queries for better performance
    const queries = orderIds.map(orderId => 
      dynamoClient.send(new QueryCommand({
        TableName: TABLE_NAMES.ORDER_ITEMS,
        IndexName: 'order-id-index',
        KeyConditionExpression: 'order_id = :order_id',
        ExpressionAttributeValues: { ':order_id': orderId }
      }))
    )

    const responses = await Promise.all(queries)
    responses.forEach(response => {
      if (response.Items) {
        results.push(...response.Items)
      }
    })

    return results
  }

  /**
   * Optimized business stalls query with product counts
   */
  static async getBusinessStallsWithMetrics(businessId: string) {
    // Get stalls
    const stallsCommand = new QueryCommand({
      TableName: TABLE_NAMES.STALLS,
      IndexName: 'business-id-index',
      KeyConditionExpression: 'business_id = :business_id',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':business_id': businessId,
        ':status': 'active'
      }
    })

    const stallsResult = await dynamoClient.send(stallsCommand)
    const stalls = stallsResult.Items || []

    // Get product counts for each stall in parallel
    const productCountQueries = stalls.map(stall =>
      dynamoClient.send(new QueryCommand({
        TableName: TABLE_NAMES.PRODUCTS,
        IndexName: 'stall-id-index',
        KeyConditionExpression: 'stall_id = :stall_id',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':stall_id': stall.id,
          ':status': 'active'
        },
        Select: 'COUNT'
      }))
    )

    const productCounts = await Promise.all(productCountQueries)

    // Combine stalls with product counts
    return stalls.map((stall, index) => ({
      ...stall,
      product_count: productCounts[index].Count || 0
    }))
  }
}

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static metrics: Map<string, {
    count: number
    totalTime: number
    avgTime: number
    maxTime: number
    minTime: number
  }> = new Map()

  static async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const endTime = Date.now()
      const duration = endTime - startTime

      this.recordMetric(queryName, duration)
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`)
      }

      return result
    } catch (error) {
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.error(`Query failed: ${queryName} after ${duration}ms`, error)
      throw error
    }
  }

  private static recordMetric(queryName: string, duration: number) {
    const existing = this.metrics.get(queryName)
    
    if (existing) {
      existing.count++
      existing.totalTime += duration
      existing.avgTime = existing.totalTime / existing.count
      existing.maxTime = Math.max(existing.maxTime, duration)
      existing.minTime = Math.min(existing.minTime, duration)
    } else {
      this.metrics.set(queryName, {
        count: 1,
        totalTime: duration,
        avgTime: duration,
        maxTime: duration,
        minTime: duration
      })
    }
  }

  static getMetrics() {
    return Object.fromEntries(this.metrics.entries())
  }

  static resetMetrics() {
    this.metrics.clear()
  }
}

/**
 * Connection pooling and optimization
 */
export class ConnectionOptimizer {
  private static connectionPool: Map<string, any> = new Map()
  
  static getOptimizedClient(region?: string) {
    const key = region || 'default'
    
    if (!this.connectionPool.has(key)) {
      // Create optimized client configuration
      const client = dynamoClient
      this.connectionPool.set(key, client)
    }
    
    return this.connectionPool.get(key)
  }

  static closeConnections() {
    this.connectionPool.clear()
  }
}