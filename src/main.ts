import './style.css'
import {setupCounter} from './counter.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>MOMODELO</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Herramienta para la enseñanza de bases de datos
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
