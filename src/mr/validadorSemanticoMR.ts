import {AnalizadorSemánticoMR} from "./analizadorSemanticoMR.ts";
import {ComparadorMR} from "./comparadorMR.ts";
import {ProgramaMR, ProgramaMRValidado} from "./modeloSintacticoMR.ts";
import {ModeloER} from "../servicios/modeloER.ts";
import {ErroresValidación} from "../servicios/errores.ts";

export class ValidadorSemánticoMR {
    ejecutarsePara(programa: ProgramaMR, modeloER: ModeloER | null): ProgramaMRValidado {
        const [validado, erroresSemánticos] = this._validarSemanticamente(programa);
        const erroresConsistencia = modeloER !== null ? this._erroresDeConsistencia(modeloER, programa) : [];

        const errores = [...erroresSemánticos, ...erroresConsistencia];
        if (errores.length > 0)
            throw new ErroresValidación(errores);
        return validado!;
    }

    private _validarSemanticamente(programa: ProgramaMR): [ProgramaMRValidado | null, string[]] {
        try {
            return [new AnalizadorSemánticoMR().validar(programa), []];
        } catch (e) {
            if (e instanceof ErroresValidación) return [null, e.errores];
            throw e;
        }
    }

    private _erroresDeConsistencia(modeloER: ModeloER, programa: ProgramaMR): string[] {
        try {
            new ComparadorMR().esConsistente(modeloER, programa);
            return [];
        } catch (e) {
            if (e instanceof ErroresValidación)
                return e.errores;

            throw e;
        }
    }
}