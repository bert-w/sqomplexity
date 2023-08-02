SELECT *
FROM users
WHERE Id IN (SELECT UserId
             FROM orders
             WHERE CreationDate > '2020-01-01' AND Status = 1)