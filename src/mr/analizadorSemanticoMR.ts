import "../utils/extensionesArray.ts";
import {ModeloRelacional} from "./modeloSintacticoMR.ts";
import {ErroresValidaciónMR} from "../servicios/errores.ts";

export class AnalizadorSemánticoMR {
    validar(modelo: ModeloRelacional): void {
        const errores: string[] = [];

        modelo.relaciones.forEach(relacion => {
            if (relacion.clavesPrimarias().isEmpty()) {
                errores.push(`Falta clave primaria en '${relacion.nombre}'.`);
            }
        });

        if (errores.length > 0)
            throw new ErroresValidaciónMR(errores);
    }
}