#!/usr/bin/env node
'use strict'

/**
 * Database Migration Script
 * Migrates from legacy schema (Food, FoodTags, Recipes, RecipeFoods)
 * to standardized schema (foods, recipes)
 *
 * Usage: node backend/migration/migrate_db.js
 */

const config = require('../config')
const { DatabseConnection } = require('../extras/other/database')

// Database connection
const db = new DatabseConnection({
    ...config.db,
    database: 'velavida'
})

const DEFAULT_OWNER = 'info@vidaviva.co'

// Migration flags - set to false to skip a step
const ENABLE_FOODS_MIGRATION = true
const ENABLE_RECIPES_MIGRATION = true

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`)
}

// ============================================
// STEP 1: Migrate Foods + FoodTags -> foods
// ============================================

async function migrateFoods() {
    if(!ENABLE_FOODS_MIGRATION) {
        log('\n========================================', 'yellow')
        log('STEP 1: Foods migration SKIPPED (disabled)', 'yellow')
        log('========================================\n', 'yellow')
        return { success: true, inserted: 0, errors: 0, skipped: true }
    }

    log('\n========================================', 'cyan')
    log('STEP 1: Migrating Foods + FoodTags -> foods', 'cyan')
    log('========================================\n', 'cyan')

    try {
        // 1.1 Read all Foods records
        log('1.1 Reading Foods table...', 'blue')
        const foodsResult = await db.execute(
            'SELECT id, name, data, lang FROM "Foods" ORDER BY id',
            []
        )
        const foods = foodsResult.rows
        log(`    Found ${foods.length} food records`, 'green')

        // 1.2 Read all FoodTags records
        log('1.2 Reading FoodTags table...', 'blue')
        const tagsResult = await db.execute(
            'SELECT food_id as id, tag FROM "FoodTags" ORDER BY id',
            []
        )
        const foodTags = tagsResult.rows
        log(`    Found ${foodTags.length} food tag records`, 'green')

        // 1.3 Group tags by food id (Foods.id = FoodTags.id)
        log('1.3 Grouping tags by food id...', 'blue')
        const tagsByFoodId = {}
        foodTags.forEach(({ id, tag }) => {
            if (!tagsByFoodId[id]) {
                tagsByFoodId[id] = []
            }
            tagsByFoodId[id].push(tag)
        })
        log(`    Grouped tags for ${Object.keys(tagsByFoodId).length} foods`, 'green')

        // 1.4 Insert into foods table
        log('1.4 Inserting into foods table...', 'blue')
        let insertedCount = 0
        let errorCount = 0

        for (const food of foods) {
            try {
                const tags = tagsByFoodId[food.id] || []
                const image = (food.data && food.data.image) ? food.data.image : null

                const newData = {
                    id: food.id,
                    name: food.name,
                    image: image,
                    lang: food.lang || 'es',
                    tags: tags
                }

                await db.execute(
                    `INSERT INTO foods (id, data, editable, owner, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, NOW(), NOW())
                     ON CONFLICT (id) DO UPDATE SET
                        data = $2,
                        updated_at = NOW()`,
                    [
                        food.id,
                        JSON.stringify(newData),
                        true,
                        DEFAULT_OWNER
                    ]
                )
                insertedCount++
                if (insertedCount % 50 === 0) {
                    log(`    Progress: ${insertedCount}/${foods.length}`, 'yellow')
                }
            } catch (error) {
                errorCount++
                log(`    Error inserting food ${food.id}: ${error.message}`, 'red')
            }
        }

        log(`\n Foods migration completed:`, 'green')
        log(`    Inserted/Updated: ${insertedCount}`, 'green')
        log(`    Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'green')

        // 1.5 Verify migration
        const verifyResult = await db.execute('SELECT COUNT(*) as count FROM foods', [])
        log(`    Total records in foods table: ${verifyResult.rows[0].count}\n`, 'cyan')

        return { success: true, inserted: insertedCount, errors: errorCount }

    } catch (error) {
        log(`\n Foods migration failed: ${error.message}`, 'red')
        console.error(error)
        return { success: false, error: error.message }
    }
}

// ============================================
// STEP 2: Migrate Recipes + RecipeFoods -> recipes
// ============================================

async function migrateRecipes() {
    if(!ENABLE_RECIPES_MIGRATION) {
        log('\n========================================', 'yellow')
        log('STEP 2: Recipes migration SKIPPED (disabled)', 'yellow')
        log('========================================\n', 'yellow')
        return { success: true, inserted: 0, errors: 0, skipped: true }
    }

    log('\n========================================', 'cyan')
    log('STEP 2: Migrating Recipes + RecipeFoods -> recipes', 'cyan')
    log('========================================\n', 'cyan')

    try {
        // 2.1 Read all Recipes records
        log('2.1 Reading Recipes table...', 'blue')
        const recipesResult = await db.execute(
            'SELECT id, name, link, data, lang FROM "Recipes" ORDER BY id',
            []
        )
        const recipes = recipesResult.rows
        log(`    Found ${recipes.length} recipe records`, 'green')

        // 2.2 Read all RecipeFoods records
        log('2.2 Reading RecipeFoods table...', 'blue')
        const recipeFoodsResult = await db.execute(
            'SELECT recipe_id, food_id FROM "RecipeFoods" ORDER BY recipe_id',
            []
        )
        const recipeFoods = recipeFoodsResult.rows
        log(`    Found ${recipeFoods.length} recipe-food associations`, 'green')

        // 2.3 Group food_ids by recipe_id
        log('2.3 Grouping food_ids by recipe_id...', 'blue')
        const foodIdsByRecipeId = {}
        recipeFoods.forEach(({ recipe_id, food_id }) => {
            if (!foodIdsByRecipeId[recipe_id]) {
                foodIdsByRecipeId[recipe_id] = []
            }
            foodIdsByRecipeId[recipe_id].push(food_id)
        })
        log(`    Grouped food_ids for ${Object.keys(foodIdsByRecipeId).length} recipes`, 'green')

        // 2.4 Insert into recipes table
        log('2.4 Inserting into recipes table...', 'blue')
        let insertedCount = 0
        let errorCount = 0

        for (const recipe of recipes) {
            try {
                const foodIds = foodIdsByRecipeId[recipe.id] || []
                const recipeData = recipe.data || {}

                const newData = {
                    name: recipe.name,
                    link: recipe.link,
                    course: recipeData.course || null,
                    difficulty: recipeData.difficulty ? parseInt(recipeData.difficulty) : 1,
                    cover: recipeData.cover || 'default-recipe.jpg',
                    tags: recipeData.tags || '',
                    lang: recipe.lang || 'es',
                    food_ids: foodIds
                }

                await db.execute(
                    `INSERT INTO recipes (id, data, editable, owner, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, NOW(), NOW())
                     ON CONFLICT (id) DO UPDATE SET
                        data = $2,
                        updated_at = NOW()`,
                    [
                        recipe.id,
                        JSON.stringify(newData),
                        true,
                        DEFAULT_OWNER
                    ]
                )
                insertedCount++
                if (insertedCount % 50 === 0) {
                    log(`    Progress: ${insertedCount}/${recipes.length}`, 'yellow')
                }
            } catch (error) {
                errorCount++
                log(`    Error inserting recipe ${recipe.id}: ${error.message}`, 'red')
            }
        }

        log(`\n Recipes migration completed:`, 'green')
        log(`    Inserted/Updated: ${insertedCount}`, 'green')
        log(`    Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'green')

        // 2.5 Verify migration
        const verifyResult = await db.execute('SELECT COUNT(*) as count FROM recipes', [])
        log(`    Total records in recipes table: ${verifyResult.rows[0].count}\n`, 'cyan')

        return { success: true, inserted: insertedCount, errors: errorCount }

    } catch (error) {
        log(`\n Recipes migration failed: ${error.message}`, 'red')
        console.error(error)
        return { success: false, error: error.message }
    }
}

// ============================================
// Main execution
// ============================================

async function main() {
    log('\nTPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW', 'cyan')
    log('Q  VelaVida Database Migration Script   Q', 'cyan')
    log('ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]\n', 'cyan')

    const startTime = Date.now()

    try {
        // Connect to database
        log('Connecting to database...', 'blue')
        await db.ready()
        log(' Connected to database: velavida\n', 'green')

        // Step 1: Migrate Foods
        const foodsResult = await migrateFoods()
        if (!foodsResult.success) {
            throw new Error('Foods migration failed')
        }

        // Step 2: Migrate Recipes
        const recipesResult = await migrateRecipes()
        if (!recipesResult.success) {
            throw new Error('Recipes migration failed')
        }

        // Summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(2)
        log('\nTPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW', 'green')
        log('Q     Migration Completed Successfully  Q', 'green')
        log('ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]\n', 'green')
        log(`Total time: ${duration}s`, 'cyan')
        log(`Foods migrated: ${foodsResult.inserted}`, 'cyan')
        log(`Recipes migrated: ${recipesResult.inserted}`, 'cyan')
        log(`Total errors: ${foodsResult.errors + recipesResult.errors}\n`, 'cyan')

        process.exit(0)

    } catch (error) {
        log('\nTPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPW', 'red')
        log('Q     Migration Failed                   Q', 'red')
        log('ZPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP]\n', 'red')
        log(`Error: ${error.message}\n`, 'red')
        console.error(error)
        process.exit(1)
    }
}

// Run migration
if (require.main === module) {
    main()
}

module.exports = { migrateFoods, migrateRecipes }
