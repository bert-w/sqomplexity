# Input a single query (returns array with 1 element):
node dist/sqomplexity.js "SELECT * FROM users"

# Input multiple queries (returns array with multiple elements):
node dist/sqomplexity.js "SELECT query1" "SELECT query2"

# Use a file as a query input:
node dist/sqomplexity.js -f "/some/path/to/file.sql"

# Use a base64 encoded query (for easy-of-use within terminals):
node dist/sqomplexity.js -b "somebase64encodedquery"

# Output score only as JSON:
node dist/sqomplexity.js -s "SELECT * FROM users"

# For more info and options:
node dist/sqomplexity.js --help