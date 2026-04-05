import "../utils/extensionesArray.ts";
import {ModeloRelacional} from "./modeloSintacticoMR.ts";

export class AnalizadorSemánticoMR {
    validar(modelo: ModeloRelacional): string[] {
        const errores: string[] = [];

        modelo.relaciones.forEach(relacion => {
            if (relacion.clavesPrimarias().isEmpty()) {
                errores.push(`Falta clave primaria en '${relacion.nombre}'.`);
            }
        });

        return errores;
    }
}