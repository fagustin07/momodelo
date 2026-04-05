import {TipoTokenMR, TokenMR} from "../tipos/tipos.ts";
import {AtributoMR, AtributoPK, AtributoSimple, ModeloRelacional, RelacionMR} from "./modeloSintacticoMR.ts";
import {TokenizadorMR} from "./tokenizadorMR.ts";
import {ErrorSintácticoMR} from "../servicios/errores.ts";

export class AnalizadorSintácticoMR {
    private _tokens: TokenMR[] = [];
    private _actual = 0;
    private _inputOriginal = "";

    analizarSintaxisDe(input: string): ModeloRelacional {
        this._inputOriginal = input;
        this._tokens = new TokenizadorMR().ejecutarseCon(input);
        this._actual = 0;

        const relaciones: RelacionMR[] = [];
        while (!this._esFin()) {
            relaciones.push(this._relacion());
        }

        return new ModeloRelacional(relaciones);
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
            if (this._es("NOMBRE")) {
                this._consumir("COMA", "','");
            }
            this._consumir("COMA", "','");
            atributos.push(this._atributo());
        }

        return atributos;
    }

    private _atributo(): AtributoMR {
        const nombre = this._consumir("NOMBRE", "nombre de un atributo").valor;

        if (this._es("LPAREN")) {
            this._avanzar();
            this._consumir("PK", "'PK'");
            this._consumir("RPAREN", "')'");
            return new AtributoPK(nombre);
        }

        if (this._es("PK")) {
            this._consumir("LPAREN", "'('");
        }

        return new AtributoSimple(nombre);
    }


    private _consumir(tipo: TipoTokenMR, esperado: string): TokenMR {
        if (this._es(tipo))
            return this._avanzar();
        const pos = this._esFin() ? this._inputOriginal.length : this._ver().posicion;
        const [fila, columna] = this._obtenerFilaYColumna(pos);
        throw new ErrorSintácticoMR(fila, columna, esperado);
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

    private _obtenerFilaYColumna(posicion: number): [number, number] {
        const textoAntes = this._inputOriginal.substring(0, posicion);
        const lineas = textoAntes.split("\n");
        const fila = lineas.length;
        const columna = lineas[fila - 1].length + 1;
        return [fila, columna];
    }
}