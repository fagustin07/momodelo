// @ts-ignore
import "./style.css";
import {Entidad} from "./modelo/entidad.ts";
import {coordenada} from "./posicion.ts";
import {init} from "./vista.ts";

init(document.body, [new Entidad("Mi Entidad", ["a", "b"], coordenada(10, 10))]);

// TODO: Agregar un topbar para poder exportar e importar