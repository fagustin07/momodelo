import {ExpresiónAR} from "./modeloSintácticoAR.ts";
import {ModeloRelacionalMaterializado, RelacionMaterializada} from "../mr/modeloRelacionalMaterializado.ts";

export class IntérpreteAR {
    ejecutar(expresión: ExpresiónAR, modelo: ModeloRelacionalMaterializado): RelacionMaterializada {
        return expresión.interpretarseCon(modelo);
    }
}
