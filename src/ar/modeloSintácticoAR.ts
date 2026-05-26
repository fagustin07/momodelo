import {ModeloRelacionalMaterializado, RelacionMaterializada} from "../mr/modeloRelacionalMaterializado.ts";

export abstract class ExpresiónAR {
    abstract interpretarseCon(modelo: ModeloRelacionalMaterializado): RelacionMaterializada;
}

export class NombreDeRelación extends ExpresiónAR {
    constructor(readonly nombre: string) {
        super();
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): RelacionMaterializada {
        return modelo.obtenerRelacion(this.nombre);
    }
}
