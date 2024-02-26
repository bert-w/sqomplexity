SELECT *
FROM users u
         LEFT JOIN tableA a ON a.id = u.id
         LEFT OUTER join tableB b ON b.id = u.id
         RIGHT OUTER JOIN tableC c ON c.id = u.id
         RIGHT JOIN tableC c ON c.id = u.id
         CROSS JOIN tableD d
         INNER JOIN tableE e ON e.id = u.id;
