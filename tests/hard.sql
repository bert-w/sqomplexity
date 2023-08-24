with cte as (select id,
                    amount,
                    case when amount > 1000 then 0 else amount end sm,
                    case when amount > 1000 then 0 else 1 end      keep
             from mytable
             where id = 1
             union all
             select t.id,
                    t.amount,
                    case when c.sm + t.amount > 1000 then c.sm else c.sm + t.amount end,
                    case when c.sm + t.amount > 1000 then 0 else 1 end
             from cte c
                      inner join mytable t on t.id = c.id + 1)
select id, amount
from cte
where keep = 1
order by id