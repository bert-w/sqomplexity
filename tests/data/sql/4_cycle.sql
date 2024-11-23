# Assumes a table `friends` where a friend relation is given by a single row
# connecting a `left_user_id` to a `right_user_id`.
SELECT *
FROM users u
         JOIN friends f1 ON u.id = f1.left_user_id
         JOIN friends f2 ON f1.left_user_id = f2.right_user_id
         JOIN friends f3 ON f2.right_user_id = f3.left_user_id AND f3.left_user_id = u.id
