const L = 1000;
const M = 2000;
const H = 3000;

const F = (data, cognitive) => data;

export default {
    clauses: {
        select: F(L, L),
        from: F(M, L),
        join: F(M, M),
        where: F(H, M),
        group_by: F(H, H),
        having: F(M, H),
        order_by: F(L, M),
        limit: F(L, L),
        offset: F(L, L)
    },
    expressions: {
        _base: F(L, L),
        table: F(M, M),
        column: F(M, M),
        string: F(L, L),
        number: F(L, L),
        star: F(L, L),
        unary: F(L, M),
        binary: F(L, M),
        function: F(H, M),
        list: F(L, L),
        aggregation_function: F(H, H),
        null: F(L, L)
    },
    operator: F(L, M),
    emergent: {
        cycle: F(M, H),
        mixed_style: F(0, M),
        subquery: F(H, H),
        variety: F(0, M)
    }
};
