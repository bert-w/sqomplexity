SELECT order_id,
       order_date,
       (SELECT COUNT(*) FROM order_items WHERE order_items.order_id = orders.order_id) AS item_count
FROM orders;