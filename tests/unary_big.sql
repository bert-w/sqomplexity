SELECT
    'Fattura Prodotti Postali' AS `type`,
    SUM(dpd.qta) AS `products_count_quantity`,
    COUNT(dpd.IDlavorazione_dett) AS `products_count`,
    GROUP_CONCAT(DISTINCT dp.prod_totali - CAST(dp.opzione1 AS UNSIGNED) SEPARATOR ' |-| ') AS `process_products_count`,
    GROUP_CONCAT(DISTINCT dp.IDdistinta) AS `product_code`,
    GROUP_CONCAT(DISTINCT dp.data_distinta) AS `process_date`,
    GROUP_CONCAT(DISTINCT dp.IDesito) AS `process_status_id`,
    GROUP_CONCAT(DISTINCT dp.note) AS `process_note`,
    GROUP_CONCAT(DISTINCT dp.IDlavorazione) AS `unique_id`,
    SUM(dpd.tariffa) AS `products_total`,
    SUM(IF(o.IDdoc IS NULL,1,0)*dpd.qta) AS `tobill_count_quantity`,
    SUM(IF(NOT o.IDdoc IS NULL,1,0)*dpd.qta) AS `billed_count_quantity`,
    SUM(IF(o.IDdoc IS NULL,1,0)) AS `tobill_count`,
    SUM(IF(o.IDdoc IS NULL, dpd.tariffa,0)) AS `tobill_total`,
    SUM(IF(NOT o.IDdoc IS NULL,1,0)) AS `billed_count`,
    SUM(IF(NOT o.IDdoc IS NULL, dpd.tariffa,0)) AS `billed_total`,
    SUM(IF(o.IDdoc IS NULL, dpd.tariffa,0)-IF(NOT o.IDdoc IS NULL, dpd.tariffa,0)) AS `bill_diff`,
    COUNT(dpd.IDlavorazione_dett) AS `products_count`,
    SUM(dpd.tariffa) AS `products_total`,
    SUM(dpd.tariffa*(dpd.iva/100)) AS `products_vat`,
    SUM(dpd.tariffa*(dpd.sconto/100.0)) AS `products_discount`,
    SUM(dpd.tariffa*(1.0-dpd.sconto/100.0)*(dpd.iva/100)) AS `products_discount_vat`,
    SUM(dpd.tariffa*(1+(dpd.iva/100.0))) AS `products_total_vat`,
    SUM(ROUND(dpd.tariffa*(1.0-dpd.sconto/100.0),5)) AS `products_total_discount`,
    SUM(dpd.tariffa*(1.0-dpd.sconto/100.0)*(1+(dpd.iva/100.0))) AS `products_total_discount_vat`,
    SUM(dpd.qta) AS `products_quantity`,
    SUM(IF(o.IDdoc IS NULL,1,0)) AS `tobill_count`,
    SUM(IF(o.IDdoc IS NULL, dpd.tariffa,0)) AS `tobill_total`,
    SUM(IF(o.IDdoc IS NULL, dpd.tariffa*(1+(dpd.iva/100.0)),0)) AS `tobill_total_vat`,
    SUM(IF(NOT o.IDdoc IS NULL,1,0)) AS `billed_count`,
    SUM(IF(NOT o.IDdoc IS NULL, dpd.tariffa,0)) AS `billed_total`,
    SUM(IF(NOT o.IDdoc IS NULL, dpd.tariffa*(1+(dpd.iva/100.0)),0)) AS `billed_total_vat`
FROM doc_prodottipostali_dett dpd
         INNER JOIN tracking t ON (dpd.IDlavorazione_dett=t.product_id)
         LEFT JOIN prodotti_pp ppp ON (dpd.IDprodotto=ppp.IDprodotto)
         LEFT JOIN categorie_pp cpp ON (ppp.categoria=cpp.IDcategoria)
         LEFT JOIN categorie_pp cppp ON (CAST(dpd.IDcategoria AS UNSIGNED)=cppp.IDcategoria)
         INNER JOIN doc_prodottipostali dp ON (dpd.IDlavorazione=dp.IDlavorazione)
         LEFT JOIN ordini o ON (dpd.IDfattura=o.IDdoc)
WHERE
    (
            (dp.tipo = 'PT' AND t.date >= '2022-05-15 00:00:00' AND t.date <= '2022-07-26 23:59:59') AND
            ((IF(dpd.IDprodotto>0, cpp.codice, IF(CAST(dpd.IDcategoria AS UNSIGNED)>0, cppp.codice, 'NONE')) NOT IN ('LAW','AR','CAD','EMESSOCAD') OR IF(dpd.IDprodotto>0, cpp.codice, IF(CAST(dpd.IDcategoria AS UNSIGNED)>0, cppp.codice, 'NONE')) IS NULL)) AND
            ((t.last IN (-1,2,3,6,7,10,11,34,35,130,131,258,514,4098,4354,8194,8450))) AND
            (((dp.opzione2 = 'PI' AND dp.data_distinta < '2022-08-25')) OR ((dp.data_distinta >= '2022-08-25')) OR ((o.IDdoc >= '1'))) AND
            (((t.last IN (-1,2,3,6,7,10,11,34,35,130,131,258,514,4098,4354,8194,8450))))
        ) AND
    (
        ((NOT t.last IN (-1,4,5,6,7,20,21,132,133,149,516,532,1028,1157,8197)))
        )
GROUP BY dpd.IDlavorazione
HAVING (1=1 AND ((tobill_count > '0')))
ORDER BY dp.data_distinta ASC;