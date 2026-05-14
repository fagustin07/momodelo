import {ModeloER} from "../servicios/modeloER.ts";
import {ProgramaMR, RelacionMR} from "./modeloSintacticoMR.ts";
import {Entidad} from "../modelo/entidad.ts";
import {ErroresValidación} from "../servicios/errores.ts";

export class ComparadorMR {
    esConsistente(modeloER: ModeloER, modeloMR: ProgramaMR): void {
        const nombreEntidades = modeloER.entidades.map(e => e.nombre().toLowerCase());
        const errores = [
            ...this._erroresPorEntidadesSinRelación(modeloER, modeloMR),
            ...this._erroresPorRelacionesSinEntidad(modeloMR, nombreEntidades),
            ...this._erroresPorInsercionesSinEntidad(modeloMR, nombreEntidades),
        ];
        if (errores.length > 0) throw new ErroresValidación(errores);
    }

    private _erroresPorEntidadesSinRelación(modeloER: ModeloER, modeloMR: ProgramaMR): string[] {
        return modeloER.entidades
            .map(e => this._obtenerErrorDeEntidad(e, modeloMR))
            .filter((e): e is string => e !== null);
    }

    private _erroresPorRelacionesSinEntidad(modeloMR: ProgramaMR, nombreEntidades: string[]): string[] {
        return modeloMR.relaciones()
            .filter(r => !nombreEntidades.includes(r.nombre.toLowerCase()))
            .map(r => `La relación '${r.nombre}' no tiene correspondencia en el MER.`);
    }

    private _erroresPorInsercionesSinEntidad(modeloMR: ProgramaMR, nombreEntidades: string[]): string[] {
        return modeloMR.inserciones()
            .filter(i => !nombreEntidades.includes(i.nombreRelacion.toLowerCase()))
            .map(i => `No se puede insertar en '${i.nombreRelacion}': no tiene correspondencia en el MER.`);
    }

    private _obtenerErrorDeEntidad(entidad: Entidad, modeloMR: ProgramaMR): string | null {
        const nombreEntidad = entidad.nombre().toLowerCase();
        const relacionAsociada = modeloMR.relaciones().find(rel => rel.nombre.toLowerCase() === nombreEntidad);

        if (!relacionAsociada) {
            return `Falta la relación '${entidad.nombre()}' en el modelo relacional.`;
        }

        if (!this._tienenMismasClavesPrimarias(entidad, relacionAsociada)) {
            return `La relación '${entidad.nombre()}' tiene una clave primaria incorrecta.`;
        }

        if (!this._tienenMismosAtributosSimples(entidad, relacionAsociada)) {
            return `La relación '${entidad.nombre()}' no contiene los mismos atributos simples que la entidad.`;
        }

        return null;
    }


    private _tienenMismasClavesPrimarias(entidad: Entidad, relacion: RelacionMR): boolean {
        const pksEncontradas = relacion.clavesPrimarias().map(pk => pk.nombre.toLowerCase());
        const pksEsperadas = entidad.atributos()
            .filter(atr => atr.esPK())
            .map(atr => atr.nombre().toLowerCase());

        return pksEsperadas.length === pksEncontradas.length
            && pksEsperadas.every(pk => pksEncontradas.includes(pk));
    }

    private _tienenMismosAtributosSimples(entidad: Entidad, relacion: RelacionMR): boolean {
        const simplesEncontrados = relacion.atributosSimples().map(atr => atr.nombre.toLowerCase());
        const simplesEsperados = entidad.atributos()
            .filter(atr => atr.tipo() === 'simple')
            .map(atr => atr.nombre().toLowerCase());

        return simplesEsperados.length === simplesEncontrados.length &&
            simplesEsperados.every(nombre => simplesEncontrados.includes(nombre));
    }
}