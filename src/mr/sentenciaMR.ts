import {AtributoMR, Fila, RelacionMR} from "./modeloSintacticoMR.ts";
import {ModeloRelacionalMaterializado, RelacionMaterializada} from "./modeloRelacionalMaterializado.ts";
import {ErrorFKInvalida} from "../servicios/errores.ts";

type ReferenciaFK = {
    fk: AtributoMR;
    relacion: RelacionMaterializada;
    nombrePK: string;
};

export abstract class SentenciaMR {
    esDefinición(): boolean {
        return false;
    }

    esInserción(): boolean {
        return false;
    }

    abstract validarseCon(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void;

    abstract interpretarseCon(modelo: ModeloRelacionalMaterializado): void;

    protected _fkMatcheaPK(nombreFK: string, nombrePK: string, nombreRelacion: string): boolean {
        const fk = nombreFK.toLowerCase();
        const pk = nombrePK.toLowerCase();
        const rel = nombreRelacion.toLowerCase();
        return fk === pk || fk === `${pk}_${rel}`;
    }
}

export class DefiniciónRelación extends SentenciaMR {
    constructor(public readonly relacion: RelacionMR) {
        super();
    }

    esDefinición(): boolean {
        return true;
    }

    validarseCon(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void {
        this._validarExistenciaDeClavePrimaria(errores);
        this._validarQueNoExistaAmbiguedadDeAtributos(errores);
        this._validarClavesForáneas(relacionesDefinidas, errores);
        relacionesDefinidas.set(this.relacion.nombre.toLowerCase(), this.relacion);
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): void {
        modelo.registrarRelacion(new RelacionMaterializada(this.relacion));
    }

    private _validarExistenciaDeClavePrimaria(errores: string[]): void {
        if (this.relacion.clavesPrimarias().isEmpty())
            errores.push(`Falta clave primaria en '${this.relacion.nombre}'.`);
    }

    private _validarQueNoExistaAmbiguedadDeAtributos(errores: string[]): void {
        const duplicados = this.relacion.atributosDuplicados();
        if (!duplicados.isEmpty())
            errores.push(`La relación '${this.relacion.nombre}' tiene atributos duplicados: ${duplicados.map(d => `'${d}'`).join(', ')}.`);
    }

    private _validarClavesForáneas(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void {
        this.relacion
            .clavesForáneas()
            .forEach(fk => {
                const relacionesReferenciadas = this._relacionesReferenciadasPor(fk.nombre, relacionesDefinidas);

                if (relacionesReferenciadas.length === 0) {
                    errores.push(
                        `El atributo FK '${fk.nombre}' en '${this.relacion.nombre}' no referencia ninguna clave primaria existente al momento de definir la relación.`
                    );
                } else if (relacionesReferenciadas.length > 1) {
                    errores.push(
                        `El atributo FK '${fk.nombre}' en '${this.relacion.nombre}' es ambigüo: puede referenciar claves primarias de ${relacionesReferenciadas.map(nombre => `'${nombre}'`).join(', ')}.`
                    );
                }
            });
    }

    private _relacionesReferenciadasPor(nombreFK: string, relacionesDefinidas: Map<string, RelacionMR>): string[] {
        return [...relacionesDefinidas]
            .filter(([nombreRelacion, relacion]) =>
                nombreRelacion !== this.relacion.nombre.toLowerCase() &&
                relacion.clavesPrimarias().some(pk => this._fkMatcheaPK(nombreFK, pk.nombre, nombreRelacion))
            )
            .map(([, relacion]) => relacion.nombre);
    }
}

export class InsertarEn extends SentenciaMR {
    constructor(
        public readonly nombreRelacion: string,
        public readonly filas: Fila[]
    ) {
        super();
    }

    esInserción(): boolean {
        return true;
    }

    interpretarseCon(modelo: ModeloRelacionalMaterializado): void {
        const relación = modelo.obtenerRelacion(this.nombreRelacion);
        this._validarIntegridadReferencial(relación, modelo);
        this.filas.forEach(fila => relación.insertarFila(fila));
    }

    private _validarIntegridadReferencial(relación: RelacionMaterializada, modelo: ModeloRelacionalMaterializado): void {
        const fks = relación.esquema.clavesForáneas();
        if (fks.length === 0) return;

        const referencias = this._encontrarRelacionesReferenciadas(fks, modelo.relaciones());

        Map.groupBy(referencias, ref => ref.relacion.nombre.toLowerCase())
            .forEach(refs => this._validarGrupoFK(relación, refs));
    }

    private _encontrarRelacionesReferenciadas(
        fks: AtributoMR[],
        relaciones: RelacionMaterializada[]
    ): ReferenciaFK[] {
        return fks.flatMap(fk =>
            this._resolverReferenciaFK(fk, this.nombreRelacion, relaciones) ?? []
        );
    }

    private _resolverReferenciaFK(
        fk: AtributoMR,
        nombreRelacionPropia: string,
        relaciones: RelacionMaterializada[]
    ): ReferenciaFK | null {
        const propia = nombreRelacionPropia.toLowerCase();

        return relaciones
            .filter(rel => rel.nombre.toLowerCase() !== propia)
            .map(rel => {
                const pk = rel.esquema.clavesPrimarias()
                    .find(pkAttr => this._fkMatcheaPK(fk.nombre, pkAttr.nombre, rel.nombre));
                return pk ? {fk, relacion: rel, nombrePK: pk.nombre} : null;
            })
            .find(ref => ref !== null) ?? null;
    }

    private _validarGrupoFK(rel: RelacionMaterializada, refs: ReferenciaFK[]): void {
        const destino = refs[0].relacion;
        const fks = refs.map(ref => ({fk: ref.fk, nombrePK: ref.nombrePK}));
        const indices = fks.map(fk => rel.esquema.atributos.indexOf(fk.fk));
        const pks = fks.map(fk => fk.nombrePK);

        const filaQueFalla = this.filas.find(fila => {
            const valoresFK = indices.map(idx => fila.valores[idx]);
            return !destino.tuplas.some(tupla => tupla.coincideEn(pks, valoresFK));
        });

        if (filaQueFalla) {
            throw new ErrorFKInvalida(
                this.nombreRelacion,
                fks.map(fk => fk.fk.nombre),
                indices.map(idx => String(filaQueFalla.valores[idx])),
                destino.nombre
            );
        }
    }

    validarseCon(relacionesDefinidas: Map<string, RelacionMR>, errores: string[]): void {
        const relacion = relacionesDefinidas.get(this.nombreRelacion.toLowerCase());

        if (relacion === undefined) {
            errores.push(`Relación '${this.nombreRelacion}' no definida.`);
        } else {
            this._validarQueNoInserteEnMultivaluados(relacion, errores);
            this._validarMismoGradoQueRelación(relacion, errores);
        }
    }

    private _validarQueNoInserteEnMultivaluados(relacion: RelacionMR, errores: string[]): void {
        if (relacion.tieneAtributosMultivaluados())
            errores.push(`No se puede insertar en '${this.nombreRelacion}' porque tiene atributos multivaluados.`);
    }

    private _validarMismoGradoQueRelación(relacion: RelacionMR, errores: string[]): void {
        this.filas.forEach((fila, index) => {
            if (fila.valores.length !== relacion.atributos.length)
                errores.push(`La ${index + 1}ª inserción en '${this.nombreRelacion}' tiene ${fila.valores.length} ${this._palabraParaTamañoAtributos(fila.valores.length)} pero la relación espera ${relacion.atributos.length}.`);
        });
    }

    private _palabraParaTamañoAtributos(cantidadDeAtributos: number): string {
        return cantidadDeAtributos === 1 ? 'atributo' : 'atributos';
    }
}