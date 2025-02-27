export class Atributo {
    private _atributos: Atributo[] = [];
    protected _id: string | null = null;
    protected _nombre: string;

    constructor(id: string, nombre: string = 'ATRIBUTO') {
        this._id = id;
        this._nombre = nombre;
    }

    id() {
        return this._id;
    }

    agregarAtributo(atributo: Atributo): void {
        this._atributos.push(atributo);
    }

    atributos(): Atributo[] {
        return this._atributos;
    }
}