# Testcase for cycle detection where aliases are set but not always used.
SELECT *
FROM table_a a
         JOIN table_b b ON a.id = b.id
         JOIN table_c c ON table_b.id = table_a.id