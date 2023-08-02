SELECT * FROM users u
LEFT JOIN tableA a on a.id = u.id
LEFT OUTER join tableB b on b.id = u.id
RIGHT OUTER JOIN tableC c on c.id = u.id
RIGHT JOIN tableC c on c.id = u.id
CROSS JOIN tableD d on d.id = u.id
INNER join tableE e on e.id = u.id