declare namespace Sqomplexity {
    export interface Expression {
        type?: string,
        name?: string,
        table?: string | null,
        column?: string,
        operator?: string,
        left?: Expression,
        right?: Expression,
        value?: any,
        args?: Expression | {
            distinct?: any,
            expr: Expression,
        } | Expression[],
        cond?: Expression,
        ast?: AST,
        on?: Expression,
        db?: string | null,
        join?: string,
        as?: string | null,
    }

    export interface AST {
        with: any,
        type: any,
        options: any,
        distinct: any,
        columns: any | '*' | {
            expr: Expression,
            as: string | null,
        }[],
        into: {
            position: any,
        },
        from: {
            db: string | null,
            table: string,
            as: string | null,
            join?: string,
            on?: Expression,
        }[],
        where: null | Expression,
        groupby: null | Expression[],
        having: null | Expression,
        orderby: null | {
            expr: Expression,
            type: "ASC" | "DESC",
        }[],
        limit: null | number | {
            separator: string,
            value: Expression,
        },
        locking_read: any,
        window: any,
    }

    export interface Weights {
        from: {
            _base: number,
            database_prefix: number,
            inner_join: number,
            left_join: number,
            right_join: number,
            full_outer_join: number,
            cross_join: number,
        },
        m_where: number,
        m_group_by: number,
        m_having: number,
        limit: number,
        offset: number,
        m_order_by: number,
        expressions: {
            _base: number,
            operators: {
                _base: number,
                or: number,
                in: number,
                and: number,
                is: number,
                not: number,
                'not in': number,
                '=': number,
                '!=': number,
                '>': number,
                '<': number,
                '>=': number,
                '<=': number,
                '+': number,
                '-': number,
                '*': number,
                '/': number,
            },
            binary_expr: number,
            number: number,
            column_ref: number,
            aggr_func: number,
            star: number,
            function: number,
            string: number,
            natural_string: number,
            single_quote_string: number,
            hex_string: number,
            full_hex_string: number,
            bit_string: number,
            unary_expr: number,
            distinct: number,
        },
        m_nesting: number,
        m_score: number,
        m_meta_score: number,
        meta_score: {
            case_usage: number,
            quote_usage: number,
        }
    }

    interface Hook {
        handle(): void,
        stats(): object,
    }
}