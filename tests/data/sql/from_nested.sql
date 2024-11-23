SELECT department_name, total_salary
FROM (SELECT department_id, SUM(salary) AS total_salary FROM employees GROUP BY department_id) AS dept_salaries
         JOIN departments ON dept_salaries.department_id = departments.department_id;
