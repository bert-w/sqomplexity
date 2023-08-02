SELECT titles.publication_id, AVG(titles.price)
FROM titles
         INNER JOIN authors
                    ON titles.publication_id = authors.publication_id
WHERE authors.status = 'approved' AND
        authors.country_id IN (
        SELECT id
        FROM countries
        WHERE continent = 'Europe'
    )
GROUP BY titles.publication_id
HAVING AVG(price) > 10
ORDER BY titles.publication_id ASC;