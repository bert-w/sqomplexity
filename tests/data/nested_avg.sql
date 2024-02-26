SELECT Name, Salary
FROM Employees e
WHERE Salary > (SELECT AVG(Salary)
                FROM Salaries s
                WHERE s.DepartmentID = e.DepartmentID);