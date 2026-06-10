import {ModeloER} from "../servicios/modeloER.ts";
import {ProgramaMR, RelacionMR} from "./modeloSintacticoMR.ts";
import {Entidad} from "../modelo/entidad.ts";
import {ErroresValidación} from "../servicios/errores.ts";
import {ReglaCardinalidad} from "./reglasCardinalidad.ts";

export class ComparadorMR {
    esConsistente(modeloER: ModeloER, modeloMR: ProgramaMR): void {
        const errores = [
            ...this._erroresPorCorrespondenciaDeEntidades(modeloER, modeloMR),
            ...this._erroresPorRelacionesMRDesconocidas(modeloER, modeloMR),
            ...this._erroresPorInsercionesSinCorrespondencia(modeloER, modeloMR),
            ...this._erroresPorReglasDeCardinalidad(modeloER, modeloMR),
        ];
        if (errores.length > 0) throw new ErroresValidación(errores);
    }

    private _erroresPorReglasDeCardinalidad(modeloER: ModeloER, modeloMR: ProgramaMR): string[] {
        return modeloER.relaciones.flatMap(relacion => {
            return ReglaCardinalidad.instanciarPara(relacion)?.validar(relacion, modeloMR.relaciones(), modeloER) ?? [];
        });
    }

    private _erroresPorCorrespondenciaDeEntidades(modeloER: ModeloER, modeloMR: ProgramaMR): string[] {
        return modeloER.entidades
            .map(e => this._obtenerErrorDeEntidad(e, modeloMR, modeloER))
            .filter((e): e is string => e !== null);
    }

    private _erroresPorRelacionesMRDesconocidas(modeloER: ModeloER, modeloMR: ProgramaMR): string[] {
        const nombresConocidos = [
            ...modeloER.entidades.map(e => e.nombre().toLowerCase()),
            ...modeloER.relaciones.map(r => r.nombre().toLowerCase()),
        ];
        return modeloMR.relaciones()
            .filter(r => !nombresConocidos.includes(r.nombre.toLowerCase()))
            .map(r => `La relación '${r.nombre}' no tiene correspondencia en el MER.`);
    }

    private _erroresPorInsercionesSinCorrespondencia(modeloER: ModeloER, modeloMR: ProgramaMR): string[] {
        const nombresConocidos = [
            ...modeloER.entidades.map(e => e.nombre().toLowerCase()),
            ...modeloER.relaciones.map(r => r.nombre().toLowerCase()),
        ];
        return modeloMR.inserciones()
            .filter(i => !nombresConocidos.includes(i.nombreRelacion.toLowerCase()))
            .map(i => `No se puede insertar en '${i.nombreRelacion}': no tiene correspondencia en el MER.`);
    }

    private _obtenerErrorDeEntidad(entidad: Entidad, modeloMR: ProgramaMR, modeloER: ModeloER): string | null {
        const nombreEntidad = entidad.nombre().toLowerCase();
        const relacionAsociada = modeloMR.relaciones().find(rel => rel.nombre.toLowerCase() === nombreEntidad);

        if (!relacionAsociada) {
            return `Falta la relación '${entidad.nombre()}' en el modelo relacional.`;
        }

        if (!this._tienenMismasClavesPrimarias(entidad, relacionAsociada, modeloER)) {
            return `La relación '${entidad.nombre()}' tiene una clave primaria incorrecta.`;
        }

        if (!this._tienenMismosAtributosMultivaluados(entidad, relacionAsociada)) {
            return `La relación '${entidad.nombre()}' no contiene los mismos atributos multivaluados que la entidad.`;
        }

        if (!this._tienenMismosAtributosSimples(entidad, relacionAsociada)) {
            return `La relación '${entidad.nombre()}' no contiene los mismos atributos simples que la entidad.`;
        }

        return null;
    }

    private _tienenMismasClavesPrimarias(entidad: Entidad, relacion: RelacionMR, modeloER: ModeloER): boolean {
        const pksEncontradas = relacion.clavesPrimarias().map(pk => pk.nombre.toLowerCase());
        const pksEsperadas = entidad.atributos()
            .filter(atr => atr.esPK())
            .map(atr => atr.nombre().toLowerCase());

        const esEntidadDébil =
            modeloER.relaciones.some(r => r.esDebil() && r.entidadOrigen() === entidad);

        const contieneTodasLasPKs =
            pksEsperadas.every(pk => pksEncontradas.includes(pk));

        return contieneTodasLasPKs &&
            (esEntidadDébil || pksEsperadas.length === pksEncontradas.length);
    }

    private _tienenMismosAtributosSimples(entidad: Entidad, relacion: RelacionMR): boolean {
        const simplesEncontrados = relacion.atributosSimples().map(atr => atr.nombre.toLowerCase());
        const simplesEsperados = entidad.atributos()
            .filter(atr => atr.tipo() === 'simple')
            .map(atr => atr.nombre().toLowerCase());

        return simplesEsperados.length === simplesEncontrados.length &&
            simplesEsperados.every(nombre => simplesEncontrados.includes(nombre));
    }

    private _tienenMismosAtributosMultivaluados(entidad: Entidad, relacion: RelacionMR): boolean {
        const multivaluadosEncontrados = relacion.atributosMultivaluados().map(atr => atr.nombre.toLowerCase());
        const multivaluadosEsperados = entidad.atributos()
            .filter(atr => atr.esMultivaluado())
            .map(atr => atr.nombre().toLowerCase());

        return multivaluadosEsperados.length === multivaluadosEncontrados.length &&
            multivaluadosEsperados.every(nombre => multivaluadosEncontrados.includes(nombre));
    }
}