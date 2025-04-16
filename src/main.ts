// @ts-ignore
import "./style.css";
import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {init} from "./vista.ts";
import {Atributo} from "./modelo/atributo.ts";

init(document.body, [new Entidad("Mi Entidad", [new Atributo("a"), new Atributo("b")], coordenada(10, 10))]);
// TODO: Agregar un topbar para poder exportar e importar