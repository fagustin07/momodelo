import "../utils/extensionesArray.ts";
import {ProgramaMR, ProgramaMRValidado, RelacionMR} from "./modeloSintacticoMR.ts";
import {ErroresValidaciónMR} from "../servicios/errores.ts";

export class AnalizadorSemánticoMR {
    validar(programa: ProgramaMR): ProgramaMRValidado {
        const errores: string[] = [];
        const relacionesDefinidas = new Map<string, RelacionMR>();

        programa.sentencias.forEach(s => s.validarseCon(relacionesDefinidas, errores));

        if (errores.length > 0)
            throw new ErroresValidaciónMR(errores);

        return new ProgramaMRValidado(programa);
    }
}