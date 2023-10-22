const L = 0.25;
const M = 0.50;
const H = 0.75;

export default {
    clauses: {
        select: L,
        from: M,
        join: M,
        where: L,
        group_by: H,
        having: M,
        order_by: L,
        limit: L,
        offset: L,
    },
    expressions: {
        _base: L,
        table: M,
        column: M,
        string: L,
        number: L,
        star: L,
        unary: L,
        binary: L,
        function: H,
        list: L,
        aggregation_function: H,
        null: L,
    },
    operator: L,
    emergent: {
        cycle: M,
        mixed_style: 0,
        subquery: H,
        variety: 0,
    },
};