# Input a single query (returns array with 1 element):
node sqomplexity.js "SELECT * FROM users"

# Input multiple queries (returns array with multiple elements):
node sqomplexity.js "SELECT query1" "SELECT query2"

# Use a file as a query input:
node sqomplexity.js -f "/some/path/to/file.sql"

# Use a base64 encoded query (for easy-of-use within terminals):
node sqomplexity.js -b "U0VMRUNUICogRlJPTSB1c2Vycw=="

# Output score only as JSON:
node sqomplexity.js -s "SELECT * FROM users"

# For more info and options:
node sqomplexity.js --help