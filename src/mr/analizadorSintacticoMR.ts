import {TipoTokenMR, TokenMR} from "../tipos/tipos.ts";
import {AtributoFK, AtributoMR, AtributoMultivaluado, AtributoPK, AtributoPKFK, AtributoSimple, Fila, ProgramaMR, RelacionMR, Valor} from "./modeloSintacticoMR.ts";
import {TokenizadorMR} from "./tokenizadorMR.ts";
import {ErrorSintácticoMR} from "../servicios/errores.ts";
import {DefiniciónRelación, InsertarEn, SentenciaMR} from "./sentenciaMR.ts";

export class AnalizadorSintácticoMR {
    private _tokens: TokenMR[] = [];
    private _actual = 0;
    private _inputOriginal = "";

    analizarSintaxisDe(input: string): ProgramaMR {
        this._inputOriginal = input;
        this._tokens = new TokenizadorMR().ejecutarseCon(input);
        this._actual = 0;

        const sentencias: SentenciaMR[] = [];
        while (!this._esFin()) {
            if (this._es("INSERTAR"))
                sentencias.push(this._insertarEn());
            else
                sentencias.push(new DefiniciónRelación(this._relacion()));
        }

        return new ProgramaMR(sentencias);
    }

    private _insertarEn(): InsertarEn {
        this._consumir("INSERTAR", "'INSERTAR'");
        this._consumir("EN", "'EN'");
        const nombreRelacion = this._consumir("NOMBRE", "nombre de una relación").valor;
        this._consumir("LBRACE", "'{'");
        const filas = this._listaFilas();
        this._consumir("RBRACE", "'}'");
        return new InsertarEn(nombreRelacion, filas);
    }

    private _listaFilas(): Fila[] {
        const filas: Fila[] = [];
        filas.push(this._fila());
        while (this._es("COMA")) {
            this._avanzar();
            filas.push(this._fila());
        }
        return filas;
    }

    private _fila(): Fila {
        this._consumir("LANGLE", "'<'");
        const valores: Valor[] = [];
        valores.push(this._valor());
        while (this._es("COMA")) {
            this._avanzar();
            valores.push(this._valor());
        }
        this._consumir("RANGLE", "'>'");
        return new Fila(valores);
    }

    private _valor(): Valor {
        if (this._es("CADENA"))  return this._avanzar().valor;
        if (this._es("NUMERO"))  return parseFloat(this._avanzar().valor);
        if (this._es("VERDADERO")) { this._avanzar(); return true; }
        if (this._es("FALSO"))   { this._avanzar(); return false; }
        const [desde, hasta, encontrado] = this._posicionesError();
        throw new ErrorSintácticoMR(desde, hasta, "un valor (cadena, número o booleano)", encontrado);
    }

    private _relacion(): RelacionMR {
        const nombre = this._consumir("NOMBRE", "nombre de una relación").valor;
        this._consumir("LANGLE", "'<'");
        const atributos = this._listaAtributos();
        this._consumir("RANGLE", "'>'");

        return new RelacionMR(nombre, atributos);
    }

    private _listaAtributos(): AtributoMR[] {
        const atributos: AtributoMR[] = [];
        atributos.push(this._atributo());

        while (!this._es("RANGLE")) {
            if (this._es("NOMBRE") || this._es("LBRACE")) {
                this._consumir("COMA", "','");
            }
            this._consumir("COMA", "','");
            atributos.push(this._atributo());
        }

        return atributos;
    }

    private _atributo(): AtributoMR {
        if (this._es("LBRACE")) {
            this._avanzar();
            const nombre = this._consumir("NOMBRE", "nombre de un atributo").valor;
            this._consumir("RBRACE", "'}'");
            return new AtributoMultivaluado(nombre);
        }

        const nombre = this._consumir("NOMBRE", "nombre de un atributo").valor;

        if (this._es("LPAREN")) {
            this._avanzar();
            const restricciones = this._restricciones();
            this._consumir("RPAREN", "')'");
            return this._atributoConRestricciones(nombre, restricciones);
        }

        return new AtributoSimple(nombre);
    }

    private _restricciones(): string[] {
        const restricciones: string[] = [];
        restricciones.push(this._consumirRestricción());
        while (this._es("COMA")) {
            this._avanzar();
            restricciones.push(this._consumirRestricción());
        }
        return restricciones;
    }

    private _consumirRestricción(): string {
        if (this._es("PK")) return this._avanzar().valor;
        if (this._es("FK")) return this._avanzar().valor;
        const [desde, hasta, encontrado] = this._posicionesError();
        throw new ErrorSintácticoMR(desde, hasta, "PK o FK", encontrado);
    }

    private _atributoConRestricciones(nombre: string, restricciones: string[]): AtributoMR {
        const tienePK = restricciones.some(r => r.toUpperCase() === "PK");
        const tieneFK = restricciones.some(r => r.toUpperCase() === "FK");

        if (tienePK && tieneFK) return new AtributoPKFK(nombre);
        if (tienePK) return new AtributoPK(nombre);
        if (tieneFK) return new AtributoFK(nombre);
        return new AtributoSimple(nombre);
    }


    private _consumir(tipo: TipoTokenMR, esperado: string): TokenMR {
        if (this._es(tipo))
            return this._avanzar();
        const [desde, hasta, encontrado] = this._posicionesError();
        throw new ErrorSintácticoMR(desde, hasta, esperado, encontrado);
    }

    private _es(tipo: TipoTokenMR): boolean {
        if (this._esFin())
            return false;
        return this._ver().tipo === tipo;
    }


    private _avanzar(): TokenMR {
        if (!this._esFin())
            this._actual++;
        return this._tokens[this._actual - 1];
    }

    private _ver(): TokenMR {
        return this._tokens[this._actual];
    }

    private _esFin(): boolean {
        return this._actual >= this._tokens.length;
    }

    private _posicionesError(): [number, number, string] {
        if (this._esFin()) {
            const pos = this._inputOriginal.length;
            return [pos, pos + 1, "finalizó el MR"];
        }
        const token = this._ver();
        const encontrado = `se encontró '${token.valor}'`;
        return [token.posicion, token.posicion + (token.valor.length || 1), encontrado];
    }
}