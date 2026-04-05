import {ModeloMR, RelacionMR, TipoTokenMR, TokenMR} from "../tipos/tipos.ts";
import {TokenizadorMR} from "./tokenizadorMR.ts";
import {ErrorSintácticoMR} from "../servicios/errores.ts";

export class AnalizadorSintácticoMR {
    private _tokens: TokenMR[] = [];
    private _actual = 0;
    private _inputOriginal = "";

    analizarSintaxisDe(input: string): ModeloMR {
        this._inputOriginal = input;
        this._tokens = new TokenizadorMR().ejecutarseCon(input);
        this._actual = 0;

        const relaciones: ModeloMR = [];
        while (!this._esFin()) {
            relaciones.push(this._relacion());
        }
        return relaciones;
    }

    private _relacion(): RelacionMR {
        const nombre = this._consumir("NOMBRE", "nombre de una relación").valor;
        this._consumir("LANGLE", "'<'");
        const atributos = this._listaAtributos();
        this._consumir("RANGLE", "'>'");

        return {nombre, atributos};
    }

    private _listaAtributos(): string[] {
        const atributos: string[] = [];
        atributos.push(this._consumir("NOMBRE", "nombre de un atributo").valor);

        while (!this._es("RANGLE")) {
            this._consumir("COMA", "','");
            atributos.push(this._consumir("NOMBRE", "nombre de un atributo").valor);
        }

        return atributos;
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