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
        clauses: {
            select: number,
            from: number,
            join: number,
            where: number,
            group_by: number,
            having: number,
            order_by: number,
            limit: number,
            offset: number,
        },
        expressions: {
            _base: number,
            table: number,
            column: number,
            string: number,
            number: number,
            star: number,
            unary: number,
            binary: number,
            function: number,
            list: number,
            aggregation_function: number,
        },
        operator: number,
        emergent: {
            cycle: number,
            mixed_style: number,
            subquery: number,
            variety: number,
        },
    }

    interface Hook {
        handle(): void,
        stats(): object,
    }
}