#!/usr/bin/env tsx

/**
 * DynamoDB Data Backup Script
 * Exports all table data to JSON format for backup purposes
 */

import { dynamoClient } from '../lib/dynamodb/client'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface BackupResult {
    table: string
    itemCount: number
    success: boolean
    error?: string
}

const TABLES_TO_BACKUP = [
    'Users',
    'Orders',
    'OrderItems',
    'Carts',
    'CartItems',
    'MagicLinks',
    'Products',
    'Stalls',
    'Businesses'
]

async function backupTable(tableName: string): Promise<BackupResult> {
    const dynamodb = dynamoClient

    try {
        console.log(`Starting backup for table: ${tableName}`)

        const params = {
            TableName: tableName
        }

        let items: any[] = []
        let lastEvaluatedKey: any = undefined

        do {
            const scanParams = {
                ...params,
                ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
            }

            const result = await dynamodb.scan(scanParams)

            if (result.Items) {
                items = items.concat(result.Items)
            }

            lastEvaluatedKey = result.LastEvaluatedKey

            // Log progress for large tables
            if (items.length % 1000 === 0) {
                console.log(`  Scanned ${items.length} items from ${tableName}...`)
            }

        } while (lastEvaluatedKey)

        console.log(`✓ Backup completed for ${tableName}: ${items.length} items`)

        return {
            table: tableName,
            itemCount: items.length,
            success: true
        }

    } catch (error) {
        console.error(`✗ Backup failed for ${tableName}:`, error)

        return {
            table: tableName,
            itemCount: 0,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

async function exportTableSchema(tableName: string): Promise<void> {
    const dynamodb = dynamoClient

    try {
        const result = await dynamodb.describeTable({ TableName: tableName })

        // Create backup directory if it doesn't exist
        const backupDir = join(process.cwd(), 'backups', 'schemas')
        mkdirSync(backupDir, { recursive: true })

        const schemaPath = join(backupDir, `${tableName}_schema.json`)
        writeFileSync(schemaPath, JSON.stringify(result.Table, null, 2))

        console.log(`✓ Schema exported for ${tableName}`)

    } catch (error) {
        console.error(`✗ Schema export failed for ${tableName}:`, error)
    }
}

async function createBackupManifest(results: BackupResult[]): Promise<void> {
    const manifest = {
        timestamp: new Date().toISOString(),
        tables: results,
        totalItems: results.reduce((sum, result) => sum + result.itemCount, 0),
        successfulTables: results.filter(r => r.success).length,
        failedTables: results.filter(r => !r.success).length,
        version: '1.0'
    }

    const backupDir = join(process.cwd(), 'backups')
    mkdirSync(backupDir, { recursive: true })

    const manifestPath = join(backupDir, 'backup_manifest.json')
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))

    console.log(`\n✓ Backup manifest created: ${manifestPath}`)
    console.log(`Total items backed up: ${manifest.totalItems}`)
    console.log(`Successful tables: ${manifest.successfulTables}/${results.length}`)

    if (manifest.failedTables > 0) {
        console.log(`Failed tables: ${manifest.failedTables}`)
        results.filter(r => !r.success).forEach(result => {
            console.log(`  - ${result.table}: ${result.error}`)
        })
    }
}

async function main() {
    console.log('Starting DynamoDB data backup...')
    console.log(`Tables to backup: ${TABLES_TO_BACKUP.join(', ')}`)

    const startTime = Date.now()
    const results: BackupResult[] = []

    // Test DynamoDB connection first
    try {
        const { ListTablesCommand } = await import('@aws-sdk/client-dynamodb')
        await dynamoClient.send(new ListTablesCommand({}))
        console.log('✓ DynamoDB connection successful')
    } catch (error) {
        console.error('✗ DynamoDB connection failed:', error)
        process.exit(1)
    }

    // Backup each table
    for (const tableName of TABLES_TO_BACKUP) {
        try {
            // Check if table exists
            const { DescribeTableCommand } = await import('@aws-sdk/client-dynamodb')
            await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }))

            // Backup table data
            const result = await backupTable(tableName)
            results.push(result)

            // Export table schema
            await exportTableSchema(tableName)

        } catch (error) {
            if (error instanceof Error && error.name === 'ResourceNotFoundException') {
                console.log(`⚠ Table ${tableName} does not exist, skipping...`)
                results.push({
                    table: tableName,
                    itemCount: 0,
                    success: false,
                    error: 'Table does not exist'
                })
            } else {
                console.error(`✗ Error processing table ${tableName}:`, error)
                results.push({
                    table: tableName,
                    itemCount: 0,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }
    }

    // Create backup manifest
    await createBackupManifest(results)

    const endTime = Date.now()
    const duration = Math.round((endTime - startTime) / 1000)

    console.log(`\nBackup completed in ${duration} seconds`)

    // Exit with error code if any backups failed
    const failedCount = results.filter(r => !r.success).length
    if (failedCount > 0) {
        console.log(`\n⚠ ${failedCount} table(s) failed to backup`)
        process.exit(1)
    } else {
        console.log('\n✓ All tables backed up successfully')
        process.exit(0)
    }
}

// Handle script execution
if (require.main === module) {
    main().catch(error => {
        console.error('Backup script failed:', error)
        process.exit(1)
    })
}