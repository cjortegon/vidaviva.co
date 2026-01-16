# Database Knowledge Base

## Table Structure

All tables in this project follow a standardized structure:
- `id` (primary key - integer or bigint)
- `editable` (boolean)
- `owner` (string)
- `data` (JSON column - stores the main entity data)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Critical**: The `data` column is of type `json` (not `jsonb`). This has important implications for query construction.

## Common PostgreSQL Errors and Solutions

### 1. DISTINCT with JSON columns

**Error:**
```
ERROR: could not identify an equality operator for type json
LINE: SELECT DISTINCT id, data
                          ^
```

**Problem:**
PostgreSQL cannot apply `DISTINCT` to columns of type `json` because there is no equality operator defined for the JSON type.

**Solution:**
Use a subquery approach to select distinct IDs first, then retrieve the data:

```sql
-- L WRONG - This will fail
SELECT DISTINCT id, data
FROM recipes
WHERE data->>'lang' = 'es'
  AND LOWER(data->>'name') ILIKE '%keyword%'

--  CORRECT - Use subquery
SELECT id, data
FROM recipes
WHERE id IN (
  SELECT DISTINCT id FROM recipes
  WHERE data->>'lang' = 'es'
    AND LOWER(data->>'name') ILIKE '%keyword%'
)
```

**Why it works:**
- The inner subquery uses `DISTINCT` only on the `id` column (which is an integer/bigint type)
- The outer query retrieves both `id` and `data` for the matched IDs
- No `DISTINCT` is applied to the `json` column

### 2. Using JSONB functions on JSON columns

**Error:**
```
ERROR: function jsonb_array_elements_text(json) does not exist
ERROR: operator does not exist: json ?| unknown
```

**Problem:**
The `data` column is of type `json`, not `jsonb`. JSONB-specific functions and operators (like `jsonb_array_elements_text()`, `?|`, `?&`, `@>`, etc.) cannot be used on `json` type columns.

**Solution:**
Use JSON equivalents for array operations:

```sql
-- ❌ WRONG - JSONB functions on JSON column
SELECT * FROM recipes
WHERE data->'food_ids' ?| $1

SELECT * FROM foods
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements_text(data->'tags') AS tag
  WHERE LOWER(tag) LIKE '%keyword%'
)

-- ✅ CORRECT - JSON functions
SELECT * FROM recipes
WHERE EXISTS (
  SELECT 1
  FROM json_array_elements_text(data->'food_ids') AS food_id
  WHERE food_id = ANY($1::text[])
)

SELECT * FROM foods
WHERE EXISTS (
  SELECT 1 FROM json_array_elements_text(data->'tags') AS tag
  WHERE LOWER(tag) LIKE '%keyword%'
)
```

**Common JSONB to JSON function mappings:**
- `jsonb_array_elements_text()` → `json_array_elements_text()`
- `jsonb_array_elements()` → `json_array_elements()`
- `?|` (any key exists) → Use `EXISTS` with `json_array_elements_text()`
- `?&` (all keys exist) → Use multiple `EXISTS` checks
- `@>` (contains) → Use `EXISTS` with element extraction

### 3. Comparing ID with JSON properties

**Error:**
```
ERROR: operator does not exist: bigint = text
```

**Problem:**
When comparing the `id` column (integer/bigint type) with a property extracted from the JSON `data` column (which is always text), PostgreSQL cannot implicitly cast between these types.

**Solution:**
Always explicitly cast both sides to `text` when comparing `id` with JSON properties:

```sql
-- L WRONG - Type mismatch
SELECT * FROM recipes
WHERE id = data->>'some_id'

--  CORRECT - Explicit text casting
SELECT * FROM recipes
WHERE id::text = data->>'some_id'::text
```

**Alternative (when using arrays):**
```sql
-- L WRONG - Type mismatch with ANY
SELECT * FROM foods
WHERE id = ANY($1)

--  CORRECT - Cast to text array
SELECT * FROM foods
WHERE id::text = ANY($1::text[])
```

**Best practice:**
When joining or comparing across tables where one value comes from a JSON field:
```sql
-- Example: Joining recipes with foods using food_ids from JSON
SELECT r.*, f.data->>'name' as food_name
FROM recipes r
JOIN foods f ON f.id::text = ANY(
  SELECT jsonb_array_elements_text(r.data->'food_ids')
)
```

## Query Patterns

### Pattern 1: Search with multiple keywords
```sql
-- Build dynamic OR conditions for each keyword
SELECT id, data
FROM recipes
WHERE id IN (
  SELECT DISTINCT id FROM recipes
  WHERE data->>'lang' = 'es'
    AND (
      LOWER(data->>'name') LIKE '%keyword1%'
      OR LOWER(data->>'name') LIKE '%keyword2%'
    )
)
```

### Pattern 2: Retrieve full data for matched IDs
```sql
-- After collecting IDs in application code
SELECT id, data
FROM recipes
WHERE id = ANY($1)
-- Pass array of IDs as parameter
```

### Pattern 3: JSON array membership check
```sql
-- Check if JSON array contains any of the specified values
-- Note: Since data is json (not jsonb), we cannot use ?| operator
SELECT id, data
FROM recipes
WHERE EXISTS (
  SELECT 1
  FROM json_array_elements_text(data->'food_ids') AS food_id
  WHERE food_id = ANY($1::text[])
)
-- $1 should be an array of strings
```

### Pattern 4: Search within JSON array tags
```sql
-- Search for keywords in a JSON array field
SELECT data->>'id' as food_id
FROM foods
WHERE data->>'lang' = 'es'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(data->'tags') AS tag
    WHERE LOWER(tag) LIKE '%keyword%'
  )
```

## Important Notes

1. **Use parameterized queries**: Always use `$1`, `$2`, etc. for user input to prevent SQL injection
2. **Case-insensitive search**: Use `LOWER()` function or `ILIKE` operator for case-insensitive matching
3. **JSON vs JSONB**: This project uses `json` type, not `jsonb`. Be aware of the differences:
   - `json` stores exact text representation
   - `jsonb` stores parsed binary format (more efficient for queries but not used here)
   - **CRITICAL**: JSONB functions and operators (`jsonb_array_elements_text()`, `?|`, `?&`, `@>`) DO NOT work with `json` type
   - Always use `json_array_elements_text()` instead of `jsonb_array_elements_text()`
   - Always use `EXISTS` with element extraction instead of JSONB operators
4. **Language filtering**: Always filter by language when applicable: `data->>'lang' = 'es'`
5. **Type casting is explicit**: PostgreSQL will not automatically cast between types when working with JSON-extracted values

## Common Mistakes to Avoid

1. ❌ `SELECT DISTINCT id, data` - Cannot use DISTINCT with json columns
2. ❌ `WHERE id = data->>'id'` - Type mismatch (bigint vs text)
3. ❌ `WHERE id = ANY($1)` when $1 contains strings - Use `id::text = ANY($1::text[])`
4. ❌ `WHERE data->'array' ?| $1` - JSONB operators don't work on `json` type
5. ❌ `jsonb_array_elements_text(data->'array')` - Use `json_array_elements_text()` instead
6. ❌ Using JSONB operators (`?|`, `?&`, `@>`) on `json` type columns
7. ❌ Forgetting to filter by language when querying multilingual data
