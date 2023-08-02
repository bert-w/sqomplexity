/**
 * @type {Sqomplexity.Weights}
 */
export default {
    from: {
        _base: 0.25,
        database_prefix: 0,
        inner_join: 0.25,
        left_join: 0.25,
        right_join: 0.5,
        full_outer_join: 0.5,
        cross_join: 0.5,
    },
    m_where: 1,
    m_group_by: 1,
    m_having: 1.5,
    limit: 0.25,
    offset: 0.25,
    m_order_by: 1,
    expressions: {
        _base: 0.25,
        operators: {
            _base: 0.25,
            or: 0.75,
            in: 1,
            and: 0.5,
            '=': 0.25,
            '>': 0.5,
            '<': 0.5,
            '>=': 0.5,
            '<=': 0.5,
        },
        binary_expr: 0,
        number: 0.25,
        column_ref: 0.25,
        aggr_func: 0.5,
        star: 0.25,
        function: 0.25,
        string: 0.25,
        natural_string: 0.25,
        single_quote_string: 0.25,
        hex_string: 0.5,
        bit_string: 0.5,
        unary_expr: 0.25,
        distinct: 0.25,
    },
    m_nesting: 1.5,
    m_score: 1,
    m_meta_score: 1,
    meta_score: {
        case_usage: 0.25,
        quote_usage: 0.25,
    }
}