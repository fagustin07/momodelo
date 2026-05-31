import {ModeloRelacionalMaterializado} from "../mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "./resultadoConsulta.ts";

export abstract class ExpresiónAR {
    abstract interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta;
}

export class NombreDeRelación extends ExpresiónAR {
    constructor(readonly nombre: string) {
        super();
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        const relación = modelo.obtenerRelacion(this.nombre);
        return new ResultadoConsulta(
            relación.nombre,
            relación.esquema.atributos.map(a => a.nombre),
            relación.tuplas.map(t => t.aRegistro()));
    }
}
