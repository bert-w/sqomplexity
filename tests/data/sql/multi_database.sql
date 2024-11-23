SELECT
    users.id
FROM my_database.users
         JOIN other_database.posts ON users.id = posts.user_id;