SELECT *
FROM tableA
         CROSS JOIN tableB ON tableA.id = tableB.id;