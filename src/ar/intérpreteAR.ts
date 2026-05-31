import {ExpresiónAR} from "./modeloSintácticoAR.ts";
import {ModeloRelacionalMaterializado} from "../mr/modeloRelacionalMaterializado.ts";
import {ResultadoConsulta} from "./resultadoConsulta.ts";

export class IntérpreteAR {
    ejecutar(expresión: ExpresiónAR, modelo: ModeloRelacionalMaterializado): ResultadoConsulta {
        return expresión.interpretarseCon(modelo);
    }
}
