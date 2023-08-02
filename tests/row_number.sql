SELECT
    QuestionId,
    QuestionUserId,
    QuestionCreationDate,
    QuestionSQLComplexity,
    ROW_NUMBER() OVER (PARTITION BY QuestionUserId ORDER BY QuestionCreationDate) AS Ordering
FROM
    features
WHERE QuestionUserId IN (SELECT QuestionUserId FROM features GROUP BY QuestionUserId HAVING COUNT(QuestionUserId) > 3)
ORDER BY QuestionUserId ASC, QuestionCreationDate ASC;