import "./style.css";
import {Entidad} from "./modelo/entidad.ts";
import {Atributo} from "./modelo/atributo.ts";
import {coordenada} from "./posicion.ts";
import {init} from "./vista.ts";
import {Relacion} from "./modelo/relacion.ts";

const entidades: Entidad[] = [
    new Entidad("CLIENTE", [
        new Atributo("nombre", coordenada(100, 180)),
        new Atributo("dni", coordenada(130, 210))
    ], coordenada(100, 100)),

    new Entidad("PEDIDO", [
        new Atributo("fecha", coordenada(350, 180)),
        new Atributo("monto", coordenada(390, 210))
    ], coordenada(600, 100)),

    new Entidad("PRODUCTO", [
        new Atributo("codigo", coordenada(600, 180)),
        new Atributo("descripcion", coordenada(620, 210))
    ], coordenada(600, 400))
];
const coord = coordenada(50,60);

const relaciones: Relacion[] = [
    new Relacion("REALIZA", entidades[0], entidades[1], coord),
    new Relacion("CONTIENE", entidades[1], entidades[2], coord),
]

init(document.body, entidades, relaciones);
