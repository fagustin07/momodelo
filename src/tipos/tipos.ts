export type CardinalidadMinima = '0' | '1';
export type CardinalidadMáxima = '1' | 'N';

export type Cardinalidad = [CardinalidadMinima, CardinalidadMáxima];

export type TipoRelacion = 'fuerte' | 'débil';

export type TipoAtributo = 'simple' | 'pk' | 'multivaluado';

export type MóduloMomodelo = 'MER' | 'MR' | 'MER/MR';

export type TipoTokenMR =
    | "NOMBRE"
    | "PK"
    | "FK"
    | "LANGLE"
    | "RANGLE"
    | "LBRACE"
    | "RBRACE"
    | "LPAREN"
    | "RPAREN"
    | "COMA"
    | "DESCONOCIDO";

export type TokenMR = {
    readonly tipo: TipoTokenMR;
    readonly valor: string;
    readonly posicion: number;
};

export const PATRON_NOMBRE = /^[A-Za-záéíóúÁÉÍÓÚñÑ_][A-Za-záéíóúÁÉÍÓÚñÑ0-9_]*\??/;

export const PALABRAS_RESERVADAS: Record<string, TipoTokenMR> = {
    PK: "PK",
    FK: "FK",
};

export const SIMBOLOS: Record<string, TipoTokenMR> = {
    "<": "LANGLE",
    ">": "RANGLE",
    "{": "LBRACE",
    "}": "RBRACE",
    "(": "LPAREN",
    ")": "RPAREN",
    ",": "COMA",
};

export type ResultadoReconocimiento = { token: TokenMR | null; longitud: number };