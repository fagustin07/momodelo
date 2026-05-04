import "../utils/extensionesArray.ts";
import {ProgramaMR} from "./modeloSintacticoMR.ts";
import {ErroresValidaciónMR} from "../servicios/errores.ts";

export class AnalizadorSemánticoMR {
    validar(programa: ProgramaMR): void {
        const errores: string[] = [];

        programa.relaciones().forEach(relacion => {
            if (relacion.clavesPrimarias().isEmpty()) {
                errores.push(`Falta clave primaria en '${relacion.nombre}'.`);
            }
        });

        if (errores.length > 0)
            throw new ErroresValidaciónMR(errores);
    }
}