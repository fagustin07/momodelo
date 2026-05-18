import {ProgramaMRValidado} from "./modeloSintacticoMR.ts";
import {ModeloRelacionalMaterializado} from "./modeloRelacionalMaterializado.ts";

export class IntérpreteMR {
    ejecutar(programa: ProgramaMRValidado): ModeloRelacionalMaterializado {
        const modelo = new ModeloRelacionalMaterializado();
        programa.sentencias.forEach(s => s.interpretarseCon(modelo));
        return modelo;
    }
}