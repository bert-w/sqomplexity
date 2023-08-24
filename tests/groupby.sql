SELECT users.id, COUNT(users.income)
FROM users
         JOIN tests ON tests.user_id = users.id
GROUP BY user_id, tests.test_id
HAVING COUNT(users.income) > 100
   AND COUNT(users.test) > 50
ORDER BY COUNT(users.income) ASC
LIMIT 5 OFFSET 10;