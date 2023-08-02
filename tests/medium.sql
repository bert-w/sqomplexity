SELECT users.*, roles.id AS role_id, COUNT(*) AS test, COUNT(DISTINCT id)
FROM roles, (SELECT column1 FROM table1 WHERE column1 > 100) AS t1
         JOIN users_to_roles ON users_to_roles.role_id = roles.id
         JOIN users ON users.id = users_to_roles.user_id AND users.id=5
WHERE roles.name = "student" AND roles.id = 5 AND roles.id IN (
    SELECT id FROM roles JOIN users ON users.id = roles.user_id
)
ORDER BY users.username