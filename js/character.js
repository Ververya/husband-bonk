const faces = `
<g class="face normal"><path d="M86 103v9m68-9v9M107 128q13 12 26 0"/></g>
<g class="face confused"><path d="M79 93l19 3m44 0 18-6M87 108v6m66-6v6m-45 19h23"/></g>
<g class="face shocked"><circle cx="87" cy="109" r="6"/><circle cx="153" cy="109" r="6"/><ellipse cx="120" cy="135" rx="8" ry="10"/></g>
<g class="face nervous"><path d="M79 95l18 4m47 0 17-4M81 109h12m54 0h12m-51 28q12-12 24 0"/><path d="M172 101q15 20 0 20q-12 0 0-20" fill="#a7d3d7" stroke-width="2"/></g>
<g class="face crying-comedy"><path d="m79 105 18 5-18 5m82-10-18 5 18 5M105 137q15-17 30 0"/><path d="M84 119v24m70-24v24" stroke="#98cad5" stroke-width="8"/></g>
<g class="face apologetic"><path d="m80 100 17 5m46 0 17-5M81 113q7 8 15 0m48 0q7 8 15 0m-51 20q12 7 24 0"/></g>`;
export function mountCharacter(element){
  element.innerHTML=`<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#38382f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M91 219v22q-12 1-12 9h32v-31m18 0v31h32q0-8-12-9v-22" fill="#626e51"/><path d="M84 166q-16 5-22 37q-2 12 9 12q9 0 13-17m72-32q16 5 22 37q2 12-9 12q-9 0-13-17" fill="#f4cfad"/><path d="M94 156q-15 8-15 29l4 43h74l4-43q0-21-15-29" fill="#ebe4d2"/><path d="M107 158v12q13 9 26 0v-12" fill="#f4cfad"/><path d="M97 183h46m-34 8h22" stroke="#b9b39e" stroke-width="3"/><ellipse cx="58" cy="111" rx="12" ry="16" fill="#f4cfad"/><ellipse cx="182" cy="111" rx="12" ry="16" fill="#f4cfad"/><path d="M58 86q0-56 62-56t62 56v39q-3 40-62 40t-62-40Z" fill="#f4cfad"/><path d="M57 94q-12-57 36-66q10-15 27-11q37-5 56 22q17 19 7 55l-12-22q-32 3-47-19q-21 24-54 21Z" fill="#46443b"/><path d="M91 40q10-8 24-7" stroke="#686559"/><ellipse cx="77" cy="128" rx="10" ry="5" fill="#e8ab91" stroke="none"/><ellipse cx="163" cy="128" rx="10" ry="5" fill="#e8ab91" stroke="none"/>${faces}</g></svg>`;
}
export function renderCharacter(element,hits){
  element.dataset.expression=hits>=100?'apologetic':hits>=75?'crying-comedy':hits>=50?'nervous':hits>=25?'shocked':hits>=10?'confused':'normal';
}
