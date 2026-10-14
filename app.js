/* Hipoglucemia RN — Guía interactiva y calculadora
   Protocolo de actuación del Servicio de Pediatría, Hospital de Montilla (Edición 01, 06/10/2026).
   Sin dependencias. Ningún dato sale del dispositivo. */
'use strict';

// Versiones de la app (se listan en Info, la más reciente arriba). Al publicar: añadir una entrada AL PRINCIPIO
// y subir también VERSION en sw.js (hipo-rn-v<número>). La portada y la pestaña Info muestran NOVEDADES[0].
const NOVEDADES = [
  { version: '12', fecha: '14/10/2026', titulo: 'Historial de versiones y vuelta a la portada', cambios: [
    'Al tocar el logo o el título de la barra superior se vuelve a la portada.',
    'Historial de versiones en la pestaña Info.',
    'Los documentos (PDF e infografía) se ven y descargan desde la pestaña Protocolo.'] },
  { version: '11', fecha: '14/10/2026', titulo: 'Portada y aviso de actualización', cambios: [
    'Portada al abrir la app, con el objetivo, la autoría y la versión.',
    'Cuando hay una versión nueva aparece el aviso «Nueva versión disponible» con el botón «Actualizar».'] },
  { version: '10', fecha: '14/10/2026', titulo: 'Visor de documentos', cambios: [
    'El protocolo y la infografía se ven dentro de la app, con el botón «Volver» (antes, en la app instalada, no se podía volver).',
    'En el móvil, «Descargar» abre el menú Compartir (guardar en Archivos, imprimir o enviar).'] },
  { version: '9', fecha: '14/10/2026', titulo: 'Segunda corrección y criterio de glucosa intravenosa', cambios: [
    '2.ª corrección: gel y toma obligatoria de fórmula de inicio de 5 mL/kg y, después, pecho si la madre lo desea; sin gel, fórmula de inicio de 8 mL/kg.',
    'Glucosa intravenosa si tras la 2.ª corrección la glucemia es < 40 mg/dL (0-24 h) o < 46 mg/dL (24-72 h) (Anexo 2, 1.4).',
    'Actualizados la guía, las calculadoras, los documentos, el algoritmo y la infografía.'] },
  { version: '8', fecha: '13/10/2026', titulo: 'Infografía', cambios: ['Infografía del protocolo (A3) para ver y descargar.'] },
  { version: '7', fecha: '13/10/2026', titulo: 'Revisión 2026 del protocolo', cambios: [
    'Cambios de las autoras: SG 10 % a 80 mL/kg/día = 5,6 mg/kg/min; alimentación precoz; lactancia materna a demanda o artificial cada 3 horas; control de glucosa capilar comprobado con venosa; nuevo ámbito de aplicación; IGFBP-3.',
    'Fórmula de inicio de 8 mL/kg en la 2.ª corrección (modificado en la versión 9).'] },
  { version: '6', fecha: '12/10/2026', titulo: 'Formato revista', cambios: ['Nueva maquetación del protocolo en formato revista (PDF).'] },
  { version: '5', fecha: '11/10/2026', titulo: 'Protocolo en PDF', cambios: ['Protocolo completo en PDF (formato normal y formato revista) para ver y descargar.'] },
  { version: '4', fecha: '11/10/2026', titulo: 'Protocolo revisado por las autoras', cambios: [
    'Primer control de glucemia a las 2 horas, objetivos ≥ 40 y ≥ 46 mg/dL, lactancia, ajuste de la Tabla 4 a partir de las 72 horas, umbrales unificados y bibliografía actualizada.'] },
  { version: '3', fecha: '08/10/2026', titulo: 'Buscador del protocolo', cambios: ['El buscador no distingue mayúsculas ni acentos y admite varias palabras.'] },
  { version: '2', fecha: '08/10/2026', titulo: 'Protocolo en acordeón', cambios: ['Los apartados del protocolo se abren de uno en uno.'] },
  { version: '1', fecha: '08/10/2026', titulo: 'Primera versión', cambios: ['Guía interactiva paso a paso y calculadoras del protocolo de hipoglucemia neonatal.'] },
];
const APP_VERSION = { num: NOVEDADES[0].version, fecha: NOVEDADES[0].fecha };

// =====================================================================
// Utilidades
// =====================================================================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const num = (v) => { if (v == null) return null; const s = String(v).trim().replace(',', '.'); if (s === '') return null; const n = Number(s); return Number.isFinite(n) ? n : null; };
const fmt = (x, d = 1) => (x == null || !Number.isFinite(x)) ? '—' : x.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
const fml = (x) => fmt(x, x < 1 ? 2 : 1);      // volúmenes en mL
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// =====================================================================
// Datos del protocolo (fuente única para guía y calculadoras)
// =====================================================================
const PR = {
  periodo(h) { return h == null ? null : h < 24 ? 'p0' : h < 72 ? 'p1' : 'p2'; },
  periodoTxt: { p0: '< 24 h de vida', p1: '24-72 h de vida', p2: '≥ 72 h de vida' },
  tipoTxt: { p0: 'Hipoglucemia precoz', p1: 'Hipoglucemia precoz', p2: 'Hipoglucemia persistente' },
  umbral: { p0: 40, p1: 46, p2: 50 },          // Tabla 1: umbral diagnóstico (<)
  objetivo: { p0: 40, p1: 46, p2: 60 },        // Tabla 1: objetivo terapéutico (≥ 40, ≥ 46, > 60)
  objIncl: { p0: true, p1: true, p2: false },
  gel: { mlkg: 0.5, mgkg: 200 },               // Anexo 1
  formula1: 5, formula2gel: 5, formula2sinGel: 8, // mL/kg · 1.ª corrección: nota 2 y Anexo 1 · 2.ª corrección: algoritmo, nota 5 y Anexo 1 (con gel, fórmula obligatoria)
  bolo: { mlkg: 2, mgkg: 200 },                // Anexo 2, 2.2 (SG 10 %)
  ivInicio: { pct: 10, mlkgd: 80, gir: 5.6 },  // Anexo 2, 2.1
  glucagon: { min: 20, max: 30, maxMg: 1 },    // Nota 4 (µg/kg)
  liqMax72: 100, liqAlt: 160,                  // Anexo 2, 2.3 y 2.6
  accesos: {
    per: { txt: 'Vía periférica', max: 12.5, hasta: 15, osm: '694 (833)' },
    uvc: { txt: 'Catéter venoso umbilical en posición baja (flujo libre)', max: 12.5, osm: '694' },
    cvc: { txt: 'Catéter venoso central (incluye umbilical)', max: 25, osm: '1388' },
    cau: { txt: 'Catéter arterial umbilical (no recomendado; solo hasta disponer de vía venosa)', max: 12.5, osm: '694', noRec: true },
  },
  concentraciones: [5, 7.5, 10, 12.5, 15, 20, 25],
};
const gir = (pct, mlkgh) => pct * mlkgh / 6;                 // Anexo 2, punto 4
const mlkghPara = (g, pct) => g * 6 / pct;
function clasif(g, per) {
  if (g < PR.umbral[per]) return 'hipo';
  if (PR.objIncl[per] ? g >= PR.objetivo[per] : g > PR.objetivo[per]) return 'ok';
  return 'limite';
}
const objTxt = (per) => `${PR.objIncl[per] ? '≥' : '&gt;'} ${PR.objetivo[per]}`;

// Tabla 4 (Anexo 2): variación de la perfusión según la glucemia preprandial
function ajusteTabla4(g, previaMenor50, horas) {
  if (g < 40) return { d: +0.8, fila: '< 40', txt: 'Aumentar 0,8' };
  if (g < 50) return previaMenor50
    ? { d: +0.4, fila: '40-50', txt: 'Aumentar 0,4 (solo si la previa fue < 50 mg/dL)' }
    : { d: 0, fila: '40-50', txt: 'La tabla solo indica aumentar 0,4 si la previa fue < 50 mg/dL' };
  if (g < 60 && horas != null && horas >= 72) return { d: 0, fila: '50-60 (> 72 h)', txt: 'En RN de más de 72 horas, mantener el aporte hasta alcanzar el objetivo de > 60 mg/dL' };
  if (g < 60) return { d: -0.4, fila: '50-60', txt: 'Disminuir 0,4' };
  if (g < 70) return { d: -0.8, fila: '60-70', txt: 'Disminuir 0,8' };
  if (g <= 90) return { d: -1.2, fila: '70-90', txt: 'Disminuir 1,2' };
  return { d: -1.6, fila: '> 90', txt: 'Disminuir 1,6' };
}

const FACTORES = [
  ['peg', 'Pequeño para la edad gestacional, restricción del crecimiento intrauterino (CIR), bajo peso al nacer.'],
  ['prem', 'Prematuridad < 37 semanas.'],
  ['geg', 'Grande para la edad gestacional.'],
  ['poster', 'Postérmino ≥ 42 semanas.'],
  ['hmd', 'Hijo de madre con diabetes (pregestacional o gestacional).'],
  ['asfixia', 'Asfixia perinatal.'],
  ['patol', 'Patología neonatal: síndrome de aspiración de meconio, enfermedad hemolítica aloinmune, policitemia, hipotermia, sepsis.'],
  ['sindr', 'Síndrome congénito (p. ej., Beckwith-Wiedemann), rasgos físicos anormales (p. ej., malformaciones de la línea media, micropene).'],
  ['farm', 'Tratamiento materno con determinados fármacos: betabloqueantes (propranolol, labetalol), hipoglucemiantes orales, corticoides prenatales, agonistas β-adrenérgicos (terbutalina) y perfusión de glucosa intraparto.'],
  ['preecl', 'Preeclampsia/eclampsia.'],
  ['famil', 'Historia familiar de una forma congénita de hipoglucemia.'],
];

// =====================================================================
// Temporizador de controles
// =====================================================================
const TIMER = { end: 0, label: '', iv: null, done: false };
function startTimer(min, label) {
  TIMER.end = Date.now() + min * 60000; TIMER.label = label; TIMER.done = false;
  clearInterval(TIMER.iv); TIMER.iv = setInterval(tickTimer, 1000); tickTimer();
}
function stopTimer() { clearInterval(TIMER.iv); TIMER.iv = null; $('#timer').hidden = true; $('#timer').classList.remove('done'); }
function tickTimer() {
  const el = $('#timer'); const left = Math.max(0, TIMER.end - Date.now());
  const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
  el.hidden = false;
  el.innerHTML = `<span class="t">${left ? `${m}:${String(s).padStart(2, '0')}` : '¡Control!'}</span><span class="lab">${esc(TIMER.label)}</span><button type="button" data-timer="stop" aria-label="Detener temporizador">✕</button>`;
  if (!left && !TIMER.done) {
    TIMER.done = true; el.classList.add('done');
    try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) { /* sin vibración */ }
    beep();
  }
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach(t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3); });
  } catch (e) { /* sin audio */ }
}
const timerBtn = (min, label) => `<button type="button" class="btn small ghost" data-timer="${min}" data-label="${esc(label)}">⏱ Avisarme en ${min} min</button>`;

// =====================================================================
// GUÍA
// =====================================================================
const S = {};
function resetState() {
  Object.assign(S, { peso: null, horas: null, eg: null, factores: {}, sint: 'asint', gel: true,
    oral: null, g1: null, g2: null, tol: null, g3: null, gp: null });
}
resetState();

function renderGuiaBase() {
  $('#tab-guia').innerHTML = `
    <div class="summary" id="summary"></div>
    <div class="card navy">
      <span class="step">Paso 1 · Datos del recién nacido</span>
      <h2>Paciente</h2>
      <div class="grid" style="margin-top:8px">
        <div class="field"><label for="g-peso">Peso</label><div class="unit"><input id="g-peso" data-s="peso" inputmode="decimal" autocomplete="off"><span>kg</span></div></div>
        <div class="field"><label for="g-horas">Horas de vida</label><div class="unit"><input id="g-horas" data-s="horas" inputmode="decimal" autocomplete="off"><span>h</span></div></div>
        <div class="field"><label for="g-eg">Edad gestacional</label><div class="unit"><input id="g-eg" data-s="eg" inputmode="decimal" autocomplete="off"><span>sem</span></div></div>
      </div>
      <h3>Síntomas</h3>
      <div class="seg" data-seg="sint">
        <button type="button" data-v="asint">Asintomático</button>
        <button type="button" data-v="leves">Síntomas leves</button>
        <button type="button" data-v="modgrav">Síntomas moderados o graves</button>
      </div>
      <details style="margin-top:8px"><summary class="lead" style="cursor:pointer">Ver síntomas sugerentes de hipoglucemia (apartado 7)</summary>
        <div class="checks" style="font-size:14px">
          <div class="note-box"><b>Síntomas adrenérgicos (activación del sistema nervioso autónomo):</b> Temblores. Sudoración. Irritabilidad. Taquipnea. Palidez.</div>
          <div class="note-box"><b>Síntomas de neuroglucopenia:</b> Mala alimentación. Succión débil. Llanto débil o agudo. Cambios en el nivel de conciencia. Hipotonía. Convulsiones.</div>
          <div class="note-box"><b>Otros:</b> Apnea. Bradicardia. Cianosis. Hipotermia.</div>
        </div>
      </details>
      <h3>Factores de riesgo (apartado 6)</h3>
      <div class="checks">${FACTORES.map(([k, t]) => `<label class="check"><input type="checkbox" data-f="${k}"><span>${t}</span></label>`).join('')}</div>
      <h3>Recursos</h3>
      <label class="check"><input type="checkbox" id="g-gel" checked><span>Dispongo de <b>gel oral de dextrosa al 40 %</b></span></label>
      <div class="row" style="margin-top:12px"><button type="button" class="btn small ghost" data-act="reset">↺ Nuevo paciente</button></div>
    </div>
    <div id="flow"></div>
    <p class="footer-note">Herramienta de apoyo basada en el protocolo. No sustituye al juicio clínico.</p>`;
  syncSeg();
}
function syncSeg() {
  $$('#tab-guia .seg[data-seg]').forEach(seg => {
    const key = seg.dataset.seg;
    $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(S[key] === b.dataset.v)));
  });
}

function renderSummary() {
  const per = PR.periodo(S.horas);
  const parts = [];
  parts.push(`<span class="pill">⚖ ${S.peso ? fmt(S.peso, 2) + ' kg' : 'peso —'}</span>`);
  parts.push(`<span class="pill">⏱ ${S.horas != null ? fmt(S.horas, 0) + ' h' : 'horas —'}</span>`);
  if (per) {
    parts.push(`<span class="pill">${PR.tipoTxt[per]} · ${PR.periodoTxt[per]}</span>`);
    parts.push(`<span class="pill hipo">Umbral &lt; ${PR.umbral[per]}</span>`);
    parts.push(`<span class="pill ok">Objetivo ${objTxt(per)}</span>`);
  }
  $('#summary').innerHTML = parts.join('');
}

// --- bloques de contenido reutilizables ---
function recordatorio(g) {
  return g != null && g < 40 ? `<div class="alert amb"><span class="i">!</span><div><b>¡RECORDATORIO!</b> Toda glucemia capilar &lt; 40 mg/dL debe confirmarse siempre en sangre completa (gasómetro ABL).<span class="src">Algoritmo · Nota 1: el tratamiento debe iniciarse sin esperar a la confirmación.</span></div></div>` : '';
}
function limiteMsg(g, per) {
  if (g == null || !per || clasif(g, per) !== 'limite') return '';
  return per === 'p2'
    ? `<div class="alert info"><span class="i">i</span><div>Glucemia ≥ ${PR.umbral[per]} mg/dL (no cumple el umbral diagnóstico) pero no alcanza el objetivo terapéutico (${objTxt(per)} mg/dL).</div></div>`
    : `<div class="alert info"><span class="i">i</span><div>Valor entre el umbral (&lt; ${PR.umbral[per]} mg/dL) y el objetivo terapéutico (${objTxt(per)} mg/dL).</div></div>`;
}
const glucInput = (id, key, label) => `
  <div class="grid"><div class="field"><label for="${id}">${label}</label><div class="unit"><input id="${id}" data-s="${key}" inputmode="decimal" autocomplete="off" value="${S[key] != null ? fmt(S[key], 0) : ''}"><span>mg/dL</span></div></div></div>`;
const yn = (key, q) => `<div class="field" style="margin-top:10px"><label>${q}</label><div class="seg yn" data-seg="${key}"><button type="button" data-v="si" aria-pressed="${S[key] === 'si'}">Sí</button><button type="button" data-v="no" aria-pressed="${S[key] === 'no'}">No</button></div></div>`;

function needPeso() { return S.peso ? '' : `<div class="alert info"><span class="i">i</span><div>Introduzca el <b>peso</b> para calcular las dosis.</div></div>`; }
const doseLine = (what, how, sub = '') => `<div class="dose"><div class="what">${what}${sub ? `<small>${sub}</small>` : ''}</div><div class="how">${how}</div></div>`;

function correccion(n) {
  // n = 1: primera corrección (algoritmo, nota 2): gel y, después, pecho o fórmula de inicio 5 mL/kg.
  // n = 2: segunda corrección (algoritmo, nota 5, Anexo 1): gel y toma OBLIGATORIA de fórmula 5 mL/kg y, tras ella, pecho si se desea;
  //        sin gel, fórmula de inicio 8 mL/kg y, después, pecho si se desea.
  const p = S.peso;
  const gel = p ? `${fml(PR.gel.mlkg * p)} mL` : '0,5 mL/kg';
  const fv = n === 1 ? PR.formula1 : S.gel ? PR.formula2gel : PR.formula2sinGel;
  const f = p ? `${fml(fv * p)} mL` : `${fv} mL/kg`;
  let html = needPeso();
  if (S.gel) html += doseLine('Gel oral de dextrosa al 40 %', gel, `0,5 mL/kg (${p ? fmt(PR.gel.mgkg * p, 0) + ' mg' : '200 mg/kg'}) · secar la boca, aplicar en la mucosa yugal y masajear la mejilla`);
  if (n === 1) html += doseLine(S.gel ? 'Después: colocar al pecho si la madre desea lactancia materna, o bien dar una toma de fórmula de inicio' : 'Sin gel: colocar al pecho si la madre desea lactancia materna, o bien dar una toma de fórmula de inicio',
    `${f} de fórmula`, `${fv} mL/kg · ${S.gel ? 'administrar primero el gel y posteriormente ofrecer la toma (nota 2; Anexo 1, primera dosis)' : 'nota 2'}`);
  else html += doseLine(S.gel ? 'Después: dar <b>siempre</b> una toma de fórmula de inicio y, tras ella, colocar al pecho si la madre desea lactancia materna' : 'Sin gel: dar una toma de fórmula de inicio y, después, colocar al pecho si la madre desea lactancia materna',
    `${f} de fórmula`, `${fv} mL/kg · ${S.gel ? 'la toma de fórmula es obligatoria, también con lactancia materna exclusiva (algoritmo; nota 5; Anexo 1, segunda dosis)' : 'nota 5'}`);
  html += `<div class="row" style="margin-top:10px"><span class="lead" style="margin:0">Comprobar glucemia <b>30 minutos tras la toma</b>.</span>${timerBtn(30, n === 1 ? 'Control tras 1.ª corrección' : 'Control tras 2.ª corrección')}</div>`;
  return html;
}

function sintAviso() {
  if (S.sint === 'leves') return `<div class="alert warn"><span class="i">!</span><div>El gel de dextrosa se plantea para la <b>hipoglucemia precoz asintomática</b> (Anexo 1). El tratamiento IV está indicado con <b>síntomas moderados o graves</b> (Anexo 2, 1.2). Ante síntomas, valore clínicamente.</div></div>`;
  return '';
}

function continuar() {
  const f = S.factores;
  const doce = f.hmd || f.geg, veinticuatro = f.peg || f.prem || (S.eg != null && S.eg < 37);
  const tag = (on) => on ? ' <span class="pill ok" style="font-size:11px">aplica</span>' : '';
  return `<div class="card ok"><span class="step">Resultado</span><h2>Continuar controles cada 3-6 horas, generalmente antes de las tomas</h2>
    <p>Controles de glucemia capilar cada 3-6 horas, generalmente antes de las tomas, durante las primeras 24-48 horas de vida (periodo con mayor riesgo de hipoglucemia), hasta que al menos tres mediciones alcancen el objetivo terapéutico.<span class="src">Apartado 6</span></p>
    <h3>Considerar suspender los controles de glucemia cuando se cumplan ambas condiciones (nota 6)</h3>
    <ul class="clean">
      <li>a) Al menos tres controles seguidos ≥ 46 mg/dL con adecuada tolerancia oral; y</li>
      <li>b) Haber completado el periodo mínimo de vigilancia: <span${doce ? ' style="font-weight:700"' : ''}>12 horas en hijos de madre diabética y grandes para la edad gestacional${tag(doce)}</span>, y <span${veinticuatro ? ' style="font-weight:700"' : ''}>24 horas en pequeños para la edad gestacional y prematuros${tag(veinticuatro)}</span>.</li>
    </ul>
    <p class="lead">Antes del alta de los RN que no han precisado aportes intravenosos (con al menos 48 horas de vida): si la glucemia está entre 45 y 50 mg/dL, asegurar aportes y comprobar que la glucemia supera los 50 mg/dL tras ellos.</p>
    <div class="row">${timerBtn(180, 'Siguiente control (3 h)')}${timerBtn(360, 'Siguiente control (6 h)')}</div></div>`;
}

function ivBlock(motivo) {
  const p = S.peso;
  const mlh = p ? PR.ivInicio.mlkgd * p / 24 : null;
  const pegPrem = S.factores.peg || S.factores.prem || (S.eg != null && S.eg < 37);
  const sint = S.sint !== 'asint';
  const gmin = [S.g1, S.g2, S.g3, S.gp].filter(v => v != null);
  const grave = gmin.some(v => v < 30);
  return `<div class="card navy"><span class="step">Tratamiento intravenoso · Anexo 2</span><h2>Iniciar aportes IV con SG 10 %</h2>
    ${motivo ? `<div class="alert info"><span class="i">→</span><div><b>Criterio:</b> ${motivo}</div></div>` : ''}
    ${needPeso()}
    ${doseLine('Suero glucosado al 10 % a 80 mL/kg/día', mlh ? `${fmt(mlh, 1)} mL/h` : '80 mL/kg/día', `= 5,6 mg/kg/min de glucosa (Anexo 2, 2.1)${mlh ? ` · ${fmt(80 * p, 0)} mL/día` : ''}`)}
    ${doseLine(`Bolo de SG 10 %${sint ? '' : ' <small>(solo si el RN está sintomático)</small>'}`, p ? `${fml(PR.bolo.mlkg * p)} mL` : '2 mL/kg', `2 mL/kg = 200 mg/kg, en 5-10 minutos · reservado para las hipoglucemias sintomáticas (Anexo 2, 2.2; algoritmo, nota 3)`)}
    ${doseLine('Si hay retraso en conseguir un acceso venoso: gel de dextrosa al 40 %', p ? `${fml(PR.gel.mlkg * p)} mL` : '0,5 mL/kg', '0,5 mL/kg (nota 3)')}
    <div class="row" style="margin-top:10px"><span class="lead" style="margin:0">Comprobar glucemia a los <b>30 minutos</b> (algoritmo); medir la glucosa (capilar inicialmente, y comprobar con venosa según cifras y evolución) a los 30-45 minutos de iniciada la infusión y tras cada modificación de dosis (Anexo 2, 2.4).</span>${timerBtn(30, 'Control tras inicio IV')}</div>
    <h3>Valorar uso de glucagón (nota 4)</h3>
    <p style="margin:4px 0">En caso de hipoglucemia grave (&lt; 30 mg/dL) o si persiste la hipoglucemia &lt; 50 mg/dL a pesar de estar administrando la dosis máxima de glucosa intravenosa en infusión continua.</p>
    ${grave ? `<div class="alert hipo"><span class="i">!</span><div>Se ha registrado una glucemia <b>&lt; 30 mg/dL</b> (hipoglucemia grave).</div></div>` : ''}
    ${pegPrem ? `<div class="alert hipo"><span class="i">✕</span><div><b>No se recomienda</b> en RN pequeños para la edad gestacional ni en prematuros, por sus escasas reservas de glucógeno.</div></div>` : ''}
    ${doseLine('Glucagón 20-30 µg/kg (máximo 1 mg)', p ? `${fmt(Math.min(PR.glucagon.min * p, 1000), 0)}-${fmt(Math.min(PR.glucagon.max * p, 1000), 0)} µg` : '20-30 µg/kg', `${p ? `= ${fmt(Math.min(PR.glucagon.min * p / 1000, 1), 3)}-${fmt(Math.min(PR.glucagon.max * p / 1000, 1), 3)} mg · ` : ''}intramuscular, subcutánea o en bolo lento intravenoso (en un minuto); se puede repetir a los 20 minutos si no hay respuesta`)}
    <h3>Objetivo terapéutico</h3>
    <div class="kpis"><div class="kpi ok"><div class="k">RN 0-24 h</div><div class="v">≥ 40</div><div class="s">mg/dL</div></div><div class="kpi ok"><div class="k">RN 24-72 h</div><div class="v">≥ 46</div><div class="s">mg/dL</div></div><div class="kpi ok"><div class="k">RN &gt; 72 h</div><div class="v">&gt; 60</div><div class="s">mg/dL</div></div><div class="kpi amb"><div class="k">Límite superior</div><div class="v">90-100</div><div class="s">mg/dL</div></div></div>
    <ul class="clean">
      <li>Ajustar el aporte según la Tabla 4 del Anexo 2 (calculadora siguiente).</li>
      <li>Si los aportes son &gt; 8-10 mg/kg/min, considerar vía central.</li>
      <li>Si los aportes son &gt; 10-12 mg/kg/min, considerar asociar medicación y realizar más estudios.</li>
    </ul>
  </div>
  ${adjustCard('iv', { peso: p, pct: 10, mlh, horas: S.horas })}
  <div class="card ok"><span class="step">Evolución</span><h2>Retirada y alta</h2>
    <ul class="clean">
      <li>Monitorizar glucosa cada 3 horas.</li>
      <li>Iniciar aportes enterales cuando sea posible y considerar la retirada de los aportes IV tras 12 horas de controles estables.</li>
      <li><b>Retirada</b>: iniciar tras 12 horas de estabilidad de las glucemias (objetivo a las 24-72 h ≥ 46 mg/dL y a partir de las 72 h &gt; 60 mg/dL), lentamente y con controles de glucemia capilar 30 minutos tras cada modificación <span class="lead">(Anexo 2, 6)</span>.</li>
      <li>Alcanzada la nutrición enteral completa, mantener los controles preprandiales hasta obtener al menos 3 controles seguidos normales.</li>
      <li><b>Alta</b> (RN que han recibido glucosa intravenosa): comprobar que se mantienen glucemias &gt; 60 mg/dL preprandiales en al menos tres tomas <span class="lead">(Anexo 2, 7)</span>.</li>
    </ul></div>`;
}

function muestraCritica() {
  return `<div class="card hipo"><span class="step">Anexo 3</span><h2>Extraer “muestra crítica”</h2>
    <p>Ante una hipoglucemia &lt; 50 mg/dL después de las 72 horas de vida, extraer <b><i>muestra crítica</i></b> de sangre. La extracción debe realizarse durante la hipoglucemia, ya sea espontánea o inducida por un ayuno controlado.</p>
    <h3>Sangre — congelar la mayor cantidad posible de suero/plasma, para estudios posteriores</h3>
    <div class="checks">${['Glucosa.', 'Beta-hidroxibutirato.', 'Ácidos grasos libres.', 'Lactato.', 'Piruvato.', 'Glicerol.', 'Alanina.', 'Función hepática y amonio.', 'Gasometría, ionograma (hiato aniónico).', 'Insulina, péptido C.', 'Cortisol, hormona de crecimiento (GH).', 'Carnitina (total y esterificada).', 'Acilcarnitinas.']
      .map(t => `<label class="check"><input type="checkbox"><span>${t}</span></label>`).join('')}</div>
    <p class="lead" style="margin-top:8px">Ocasionalmente (no requieren extracción en hipoglucemia): Aminoácidos. IGFBP-3. IGF-1. Pro-IGF-II. Tiroxina libre, tirotropina. Isoformas de transferrina.</p>
    <h3>Orina — congelar una alícuota de la primera micción tras la hipoglucemia</h3>
    <div class="checks">${['pH, iones.', 'Cuerpos cetónicos.', 'Sustancias reductoras.', 'Ácidos orgánicos.', 'Perfil de acilglicinas.']
      .map(t => `<label class="check"><input type="checkbox"><span>${t}</span></label>`).join('')}</div></div>`;
}

function renderFlow() {
  renderSummary();
  const per = PR.periodo(S.horas);
  const out = [];
  if (S.eg != null && S.eg < 35) out.push(`<div class="alert warn"><span class="i">!</span><div>El algoritmo del protocolo está diseñado para <b>RN ≥ 35 semanas de gestación</b> (apartado 3, Ámbito de aplicación).</div></div>`);
  if (!Object.values(S.factores).some(Boolean)) out.push(`<div class="alert info"><span class="i">i</span><div>El protocolo se aplica a los RN <b>con factores de riesgo</b> de hipoglucemia y a los RN que presenten hipoglucemia. Marque los factores presentes.</div></div>`);
  if (!per) { out.push(`<div class="card plain"><p class="lead" style="margin:0">Introduzca las <b>horas de vida</b> para empezar.</p></div>`); $('#flow').innerHTML = out.join(''); return; }

  // ----- Hipoglucemia persistente (≥72 h) -----
  if (per === 'p2') {
    out.push(`<div class="card hipo"><span class="step">≥72 h de vida</span><h2>Hipoglucemia persistente</h2>
      <p class="lead">Umbral diagnóstico &lt; 50 mg/dL · objetivo terapéutico &gt; 60 mg/dL (Tabla 1). El algoritmo del apartado 8 corresponde a la hipoglucemia precoz.</p>
      ${glucInput('g-gp', 'gp', 'Glucemia')}${recordatorio(S.gp)}${limiteMsg(S.gp, per)}</div>`);
    if (S.gp != null) {
      const c = clasif(S.gp, per);
      if (c === 'hipo') { out.push(muestraCritica()); out.push(ivBlock('Hipoglucemia persistente (&lt; 50 mg/dL después de las 72 horas de vida).')); }
      else if (c === 'ok') out.push(`<div class="card ok"><span class="step">Resultado</span><h2>Glucemia en objetivo (&gt; 60 mg/dL)</h2><p class="lead">Alta de los RN que han recibido glucosa intravenosa: comprobar que se mantienen glucemias &gt; 60 mg/dL preprandiales en al menos tres tomas (Anexo 2, 7).</p></div>`);
    }
    $('#flow').innerHTML = out.join(''); return;
  }

  // ----- Hipoglucemia precoz (<72 h): algoritmo -----
  out.push(`<div class="card"><span class="step">Paso 2</span><h2>¿Tiene posibilidad de alimentación por vía oral?</h2>
    <div class="seg yn" data-seg="oral"><button type="button" data-v="si" aria-pressed="${S.oral === 'si'}">Sí</button><button type="button" data-v="no" aria-pressed="${S.oral === 'no'}">No, sin posibilidad de alimentación enteral</button></div></div>`);
  if (S.oral === 'no') { out.push(ivBlock('RN con hipoglucemia sin posibilidad de alimentación enteral (Anexo 2, 1.1).')); $('#flow').innerHTML = out.join(''); return; }
  if (S.oral !== 'si') { $('#flow').innerHTML = out.join(''); return; }

  {
    const falta = S.horas != null && S.horas < 2 ? Math.round((2 - S.horas) * 60) : null;
    out.push(`<div class="card"><span class="step">Paso 3 · Primer control</span><h2>Alimentación precoz y primer control</h2>
    <ul class="clean"><li>Alimentación precoz.</li><li>En los RN de riesgo asintomáticos, la primera glucemia capilar se determinará a las <b>2 horas de vida</b>, coincidiendo con la alimentación.</li><li>Si el RN presenta síntomas compatibles con hipoglucemia, la glucemia se determinará <b>inmediatamente</b>, sin esperar a las 2 horas.</li></ul>
    ${S.sint !== 'asint' ? `<div class="alert hipo"><span class="i">!</span><div>RN con síntomas: <b>determinar la glucemia ahora</b>.</div></div>` : falta ? `<div class="row" style="margin-bottom:8px">${timerBtn(falta, 'Primera glucemia (2 h de vida)')}</div>` : ''}
    ${glucInput('g-g1', 'g1', 'Glucemia del primer control')}${recordatorio(S.g1)}${limiteMsg(S.g1, per)}</div>`);
  }
  if (S.g1 == null) { $('#flow').innerHTML = out.join(''); return; }

  const c1 = clasif(S.g1, per);
  if (c1 === 'hipo' && S.sint === 'modgrav') {
    out.push(ivBlock('RN con hipoglucemia y síntomas moderados o graves (Anexo 2, 1.2). Si RN sintomático, administrar bolo de SG 10 %.'));
    $('#flow').innerHTML = out.join(''); return;
  }
  if (c1 === 'hipo') {
    out.push(`<div class="card hipo"><span class="step">Paso 4 · Hipoglucemia (${S.g1} &lt; ${PR.umbral[per]} mg/dL)</span><h2>Primera corrección</h2>${sintAviso()}${correccion(1)}
      ${glucInput('g-g2', 'g2', 'Glucemia 30 minutos tras la toma')}${recordatorio(S.g2)}${yn('tol', '¿Buena tolerancia oral?')}</div>`);
  } else {
    out.push(`<div class="card ok"><span class="step">Paso 4 · Glucemia ${objTxt(per)} mg/dL</span><h2>Lactancia a demanda o cada 3 horas</h2>
      <ul class="clean"><li>Lactancia materna a demanda o lactancia artificial cada 3 horas.</li><li>Comprobar glucemia antes de la siguiente toma.</li></ul>
      <div class="row">${timerBtn(180, 'Control antes de la siguiente toma')}</div>
      ${glucInput('g-g2', 'g2', 'Glucemia antes de la siguiente toma')}${recordatorio(S.g2)}${yn('tol', '¿Buena tolerancia oral?')}</div>`);
  }
  if (S.g2 == null || !S.tol) { $('#flow').innerHTML = out.join(''); return; }

  // Decisión: buena tolerancia oral y glucemia > 30 mg/dL
  const decis = S.tol === 'si' && S.g2 > 30;
  out.push(`<div class="card ${decis ? 'ok' : 'hipo'}"><span class="step">Paso 5 · Decisión</span><h2>¿Buena tolerancia oral y glucemia &gt; 30 mg/dL? <b>${decis ? 'Sí' : 'No'}</b></h2></div>`);
  if (!decis) {
    const m = S.tol === 'no' ? 'Mala tolerancia oral.' : `Glucemia ≤ 30 mg/dL (RN con hipoglucemia asintomática y glucemia &lt; 30 mg/dL tras una primera corrección, Anexo 2, 1.3).`;
    out.push(ivBlock(m)); $('#flow').innerHTML = out.join(''); return;
  }
  const c2 = clasif(S.g2, per);
  if (c2 !== 'hipo') { out.push(limiteMsg(S.g2, per)); out.push(continuar()); $('#flow').innerHTML = out.join(''); return; }
  if (S.sint === 'modgrav') { out.push(ivBlock('RN con hipoglucemia y síntomas moderados o graves (Anexo 2, 1.2).')); $('#flow').innerHTML = out.join(''); return; }

  out.push(`<div class="card hipo"><span class="step">Paso 6 · Hipoglucemia (${S.g2} &lt; ${PR.umbral[per]} mg/dL)</span><h2>Segunda corrección</h2>${sintAviso()}${correccion(2)}
    ${glucInput('g-g3', 'g3', 'Glucemia 30 minutos tras la toma')}${recordatorio(S.g3)}${limiteMsg(S.g3, per)}</div>`);
  if (S.g3 == null) { $('#flow').innerHTML = out.join(''); return; }
  const c3 = clasif(S.g3, per);
  if (c3 === 'hipo') out.push(ivBlock(`Persiste la hipoglucemia tras la segunda corrección (Anexo 2, 1.4: glucemia &lt; 40 mg/dL (0-24 h) o &lt; 46 mg/dL (24-72 h) tras una segunda corrección). Si tras la segunda dosis de gel persiste la hipoglucemia, está indicado el ingreso (Anexo 1).`));
  else out.push(continuar());
  $('#flow').innerHTML = out.join('');
}

// =====================================================================
// CALCULADORAS
// =====================================================================
const pctOptions = (sel) => PR.concentraciones.map(c => `<option value="${c}"${c === sel ? ' selected' : ''}>SG ${fmt(c, c % 1 ? 1 : 0)} %</option>`).join('');
const accOptions = (sel = '') => `<option value="">— sin especificar —</option>` + Object.entries(PR.accesos).map(([k, a]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${a.txt}</option>`).join('');
const inp = (id, label, unit, val = '', ph = '') => `<div class="field"><label for="${id}">${label}</label><div class="unit"><input id="${id}" inputmode="decimal" autocomplete="off" value="${val ?? ''}" placeholder="${ph}"><span>${unit}</span></div></div>`;

function adjustCard(pfx, d = {}) {
  return `<div class="card" data-calc="adjust" data-pfx="${pfx}"><span class="step">Anexo 2 · Tabla 4</span><h2>Ajuste de la perfusión según glucemia</h2>
    <div class="grid">
      ${inp(`${pfx}-peso`, 'Peso', 'kg', d.peso != null ? fmt(d.peso, 2) : '')}
      <div class="field"><label for="${pfx}-pct">Concentración actual</label><select id="${pfx}-pct">${pctOptions(d.pct ?? 10)}</select></div>
      ${inp(`${pfx}-mlh`, 'Ritmo actual', 'mL/h', d.mlh != null ? fmt(d.mlh, 1) : '')}
      ${inp(`${pfx}-g`, 'Glucemia preprandial', 'mg/dL')}
      ${inp(`${pfx}-h`, 'Horas de vida', 'h', d.horas != null ? fmt(d.horas, 0) : '')}
      ${inp(`${pfx}-oral`, 'Aporte oral', 'mL/kg/día', '', '0')}
      <div class="field"><label for="${pfx}-acc">Acceso vascular</label><select id="${pfx}-acc">${accOptions()}</select></div>
    </div>
    <label class="check hidden" id="${pfx}-prevwrap" style="margin-top:8px"><input type="checkbox" id="${pfx}-prev"><span>La glucemia previa fue &lt; 50 mg/dL</span></label>
    <div id="${pfx}-out"></div></div>`;
}
function calcAdjust(box) {
  const p = box.dataset.pfx, v = (k) => num($(`#${p}-${k}`, box).value);
  const peso = v('peso'), pct = num($(`#${p}-pct`, box).value), mlh = v('mlh'), g = v('g'), h = v('h'), oral = v('oral') || 0, acc = $(`#${p}-acc`, box).value;
  $(`#${p}-prevwrap`, box).classList.toggle('hidden', !(g != null && g >= 40 && g < 50));
  const out = $(`#${p}-out`, box);
  if (!peso || !pct || mlh == null) { out.innerHTML = `<p class="lead" style="margin-top:10px">Introduzca peso, concentración y ritmo actual.</p>`; return; }
  const mlkgh = mlh / peso, girAct = gir(pct, mlkgh), mlkgd = mlkgh * 24;
  let html = `<div class="kpis"><div class="kpi"><div class="k">Aporte actual</div><div class="v">${fmt(girAct, 1)}</div><div class="s">mg/kg/min</div></div><div class="kpi"><div class="k">Líquidos IV</div><div class="v">${fmt(mlkgd, 0)}</div><div class="s">mL/kg/día · ${fmt(mlkgh, 2)} mL/kg/h</div></div></div>`;
  if (g == null) { out.innerHTML = html + girWarnings(girAct, pct, acc, mlkgd + oral, h); return; }
  const a = ajusteTabla4(g, $(`#${p}-prev`, box).checked, h);
  const nuevo = Math.max(0, girAct + a.d), nMlkgh = mlkghPara(nuevo, pct), nMlh = nMlkgh * peso, nMlkgd = nMlkgh * 24;
  const cls = a.d > 0 ? 'ok' : a.d < 0 ? 'hipo' : '';
  html += `<div class="alert ${a.d > 0 ? 'ok' : a.d < 0 ? 'hipo' : 'info'}"><span class="i">${a.d > 0 ? '↑' : a.d < 0 ? '↓' : '='}</span><div>Glucemia ${fmt(g, 0)} mg/dL → fila <b>${a.fila}</b>: <b>${a.txt}</b>${a.d ? ' mg/kg/min' : ''}.</div></div>`;
  if (g > 100) html += `<div class="alert amb"><span class="i">!</span><div>Por encima del límite superior de glucemia (90-100 mg/dL).</div></div>`;
  html += `<div class="kpis"><div class="kpi ${cls}"><div class="k">Nuevo aporte</div><div class="v">${fmt(nuevo, 1)}</div><div class="s">mg/kg/min</div></div><div class="kpi ${cls}"><div class="k">Nuevo ritmo (SG ${fmt(pct, pct % 1 ? 1 : 0)} %)</div><div class="v">${fmt(nMlh, 1)}</div><div class="s">mL/h · ${fmt(nMlkgd, 0)} mL/kg/día</div></div></div>`;
  html += `<div class="row">${timerBtn(30, 'Control tras ajuste IV')}<span class="lead" style="margin:0">Medir a los 30-45 min de cada modificación (Anexo 2, 2.4).</span></div>`;
  html += girWarnings(nuevo, pct, acc, nMlkgd + oral, h);
  html += alternativas(nuevo, peso, acc, oral, h);
  out.innerHTML = html;
}
function girWarnings(g, pct, acc, liqTot, h) {
  const w = [];
  if (g > 10) w.push(['warn', `Aportes &gt; 10-12 mg/kg/min: considerar asociar medicación y realizar más estudios (algoritmo); si son necesarios aportes superiores a 10-12 mg/kg/min, considerar otras opciones terapéuticas (Anexo 2, 2.6).`]);
  if (g > 8) w.push(['amb', `Aportes &gt; 8-10 mg/kg/min: considerar vía central (algoritmo).`]);
  if (h != null && h < 72 && liqTot > PR.liqMax72) w.push(['warn', `Líquidos totales ${fmt(liqTot, 0)} mL/kg/día: el aporte total máximo en las primeras 72 h (intravenoso y oral) es 100 mL/kg/día, para prevenir la hiponatremia (Anexo 2, 2.3).`]);
  if (liqTot > PR.liqAlt) w.push(['hipo', `Líquidos &gt; 160 mL/kg/día: considerar otras opciones terapéuticas (Anexo 2, 2.6).`]);
  if (acc) {
    const a = PR.accesos[acc];
    if (a.noRec) w.push(['warn', `Catéter arterial umbilical: no recomendado; solo hasta disponer de vía venosa (Tabla 6).`]);
    if (pct > (a.hasta || a.max)) w.push(['hipo', `SG ${fmt(pct, 1)} % supera la concentración máxima para ${a.txt.toLowerCase()} (${fmt(a.max, 1)} %${a.hasta ? `, hasta ${a.hasta} %` : ''}).`]);
    else if (pct > a.max) w.push(['amb', `SG ${fmt(pct, 1)} %: por encima del 12,5 % en vía periférica (Tabla 6: 12,5 %, hasta 15 %).`]);
  }
  return w.map(([c, t]) => `<div class="alert ${c}"><span class="i">!</span><div>${t}</div></div>`).join('');
}
function alternativas(g, peso, acc, oral, h) {
  if (!g) return '';
  const max = acc ? (PR.accesos[acc].hasta || PR.accesos[acc].max) : null;
  const rows = PR.concentraciones.map(c => {
    const mk = mlkghPara(g, c), mlh = mk * peso, mkd = mk * 24, tot = mkd + (oral || 0);
    const excAcc = max != null && c > max, excLiq = (h != null && h < 72 && tot > PR.liqMax72) || tot > PR.liqAlt;
    return `<tr><td class="l">SG ${fmt(c, c % 1 ? 1 : 0)} %</td><td>${fmt(mlh, 1)}</td><td class="${excLiq ? 'warn' : ''}">${fmt(mkd, 0)}</td><td>${excAcc ? '<span style="color:var(--hipo);font-weight:700">supera acceso</span>' : excLiq ? '<span style="color:var(--warn);font-weight:700">líquidos</span>' : '✓'}</td></tr>`;
  }).join('');
  return `<details style="margin-top:10px"><summary class="lead" style="cursor:pointer">Ver ritmo equivalente con otras concentraciones (fórmula del Anexo 2, punto 4)</summary>
    <div class="tbl-wrap"><table><thead><tr><th class="l">Solución</th><th>mL/h</th><th>mL/kg/día</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}

function renderCalc() {
  $('#tab-calc').innerHTML = `
    <div class="card navy" data-calc="doses"><span class="step">Dosis por peso</span><h2>Dosis rápidas</h2>
      <div class="grid">${inp('d-peso', 'Peso', 'kg')}</div><div id="d-out"></div></div>

    <div class="card" data-calc="gir"><span class="step">Anexo 2 · punto 4</span><h2>Aportes de glucosa (mg/kg/min)</h2>
      <p class="lead">Fórmula: %SG × ritmo (mL/kg/h) ÷ 6</p>
      <div class="grid">${inp('c-peso', 'Peso', 'kg')}<div class="field"><label for="c-pct">Concentración</label><select id="c-pct">${pctOptions(10)}</select></div>
        ${inp('c-mlh', 'Ritmo', 'mL/h')}${inp('c-mlkgd', 'o bien', 'mL/kg/día')}</div><div id="c-out"></div></div>

    <div class="card" data-calc="ritmo"><span class="step">Cálculo inverso</span><h2>Ritmo para un aporte deseado</h2>
      <div class="grid">${inp('r-peso', 'Peso', 'kg')}${inp('r-gir', 'Aporte deseado', 'mg/kg/min')}<div class="field"><label for="r-acc">Acceso vascular</label><select id="r-acc">${accOptions()}</select></div>${inp('r-h', 'Horas de vida', 'h')}</div><div id="r-out"></div></div>

    ${adjustCard('aj')}

    <div class="card" data-calc="tabla5"><span class="step">Anexo 2 · Tabla 5</span><h2>Aportes de glucosa según concentración y ritmo</h2>
      <div class="grid">${inp('t-peso', 'Peso (opcional, para ver mL/h)', 'kg')}</div><div id="t-out"></div></div>

    <div class="card" data-calc="osm"><span class="step">Anexo 2 · Tabla 6</span><h2>Concentración máxima por acceso vascular</h2><div id="o-out"></div></div>
    <p class="footer-note">Herramienta de apoyo basada en el protocolo. No sustituye al juicio clínico.</p>`;
  $$('#tab-calc [data-calc]').forEach(runCalc);
}

const CALC = {
  doses(box) {
    const p = num($('#d-peso', box).value), o = $('#d-out', box);
    if (!p) { o.innerHTML = `<p class="lead" style="margin-top:10px">Introduzca el peso.</p>`; return; }
    o.innerHTML = `<div style="margin-top:8px">
      ${doseLine('Gel oral de dextrosa al 40 %', `${fml(0.5 * p)} mL`, `0,5 mL/kg = ${fmt(200 * p, 0)} mg (Anexo 1)`)}
      ${doseLine('Fórmula de inicio, 1.ª corrección (si no se coloca al pecho)', `${fml(5 * p)} mL`, '5 mL/kg (nota 2; Anexo 1, primera dosis)')}
      ${doseLine('Fórmula de inicio, 2.ª corrección con gel (siempre; después, pecho si se desea)', `${fml(5 * p)} mL`, '5 mL/kg (algoritmo; nota 5; Anexo 1, segunda dosis)')}
      ${doseLine('Fórmula de inicio, 2.ª corrección sin gel (después, pecho si se desea)', `${fml(8 * p)} mL`, '8 mL/kg (nota 5)')}
      ${doseLine('Bolo de SG 10 % (hipoglucemia sintomática)', `${fml(2 * p)} mL`, '2 mL/kg = 200 mg/kg, en 5-10 minutos (Anexo 2, 2.2)')}
      ${doseLine('SG 10 % inicial a 80 mL/kg/día', `${fmt(80 * p / 24, 1)} mL/h`, '5,6 mg/kg/min (Anexo 2, 2.1)')}
      ${doseLine('Glucagón 20-30 µg/kg (máximo 1 mg)', `${fmt(Math.min(20 * p, 1000), 0)}-${fmt(Math.min(30 * p, 1000), 0)} µg`, 'Nota 4 · no se recomienda en RN pequeños para la edad gestacional ni en prematuros')}
      ${doseLine('Líquidos máximos primeras 72 h', `${fmt(100 * p / 24, 1)} mL/h`, '100 mL/kg/día, IV y oral (Anexo 2, 2.3)')}</div>`;
  },
  gir(box) {
    const p = num($('#c-peso', box).value), pct = num($('#c-pct', box).value), mlh = num($('#c-mlh', box).value), mkd = num($('#c-mlkgd', box).value), o = $('#c-out', box);
    let mk = null;
    if (mlh != null && p) mk = mlh / p; else if (mkd != null) mk = mkd / 24;
    if (mk == null) { o.innerHTML = `<p class="lead" style="margin-top:10px">Introduzca el ritmo en mL/h (con el peso) o en mL/kg/día.</p>`; return; }
    const g = gir(pct, mk);
    const cls = g > 10 ? 'warn' : (g >= 4 && g <= 6) ? 'ok' : '';
    o.innerHTML = `<div class="kpis"><div class="kpi ${cls}"><div class="k">Aporte de glucosa</div><div class="v">${fmt(g, 1)}</div><div class="s">mg/kg/min</div></div>
      <div class="kpi"><div class="k">Ritmo</div><div class="v">${fmt(mk * 24, 0)}</div><div class="s">mL/kg/día · ${fmt(mk, 2)} mL/kg/h${p ? ` · ${fmt(mk * p, 1)} mL/h` : ''}</div></div></div>${girWarnings(g, pct, '', mk * 24, null)}`;
  },
  ritmo(box) {
    const p = num($('#r-peso', box).value), g = num($('#r-gir', box).value), acc = $('#r-acc', box).value, h = num($('#r-h', box).value), o = $('#r-out', box);
    if (!p || !g) { o.innerHTML = `<p class="lead" style="margin-top:10px">Introduzca peso y aporte deseado.</p>`; return; }
    o.innerHTML = girWarnings(g, 0, '', 0, null) + alternativas(g, p, acc, 0, h).replace('<details', '<details open');
  },
  adjust: calcAdjust,
  tabla5(box) {
    const p = num($('#t-peso', box).value), o = $('#t-out', box);
    const filas = [60, 80, 100, 120, 140, 160, 180, 200], cols = [5, 7.5, 10, 12.5, 15, 20];
    const OSM = { 5: 277, 7.5: 416, 10: 555, 12.5: 693, 15: 833, 20: 1110 };   // cabecera de la Tabla 5
    const head = `<tr><th>mL/kg/día<br><small>(mL/kg/h)</small></th>${cols.map(c => `<th>Glucosado ${fmt(c, c % 1 ? 1 : 0)}%<br><small>(${OSM[c]} mOsm/L)</small></th>`).join('')}</tr>`;
    const body = filas.map(f => `<tr><td><b>${f}</b> <small>(${fmt(f / 24, 1)})</small>${p ? `<br><small>${fmt(f * p / 24, 1)} mL/h</small>` : ''}</td>${cols.map(c => {
      const v = gir(c, f / 24); const cls = (c === 10 && (f === 60 || f === 80)) ? 'ok' : v > 10 ? 'warn' : '';
      return `<td class="${cls}">${fmt(v, 1)}</td>`; }).join('')}</tr>`).join('');
    o.innerHTML = `<div class="tbl-wrap"><table>${head}${body}</table></div>
      <p class="tbl-note"><span style="color:var(--ok);font-weight:700">En verde</span>: aportes iniciales típicos del RN. <span style="color:var(--warn);font-weight:700">En naranja</span>: con aportes &gt; 10-12 mg/kg/min, valorar ampliar el estudio y/o asociar tratamiento farmacológico.</p>
      `;
  },
  osm(box) {
    $('#o-out', box).innerHTML = `<div class="tbl-wrap"><table><tr><th class="l">Acceso vascular</th><th>Concentración máxima</th><th>Osmolaridad (mOsm/L)</th></tr>
      ${Object.values(PR.accesos).map(a => `<tr><td class="l"><b>${a.noRec ? a.txt.replace('no recomendado', '<span style="color:var(--hipo)">no recomendado</span>') : a.txt}</b></td><td>${fmt(a.max, 1)}%${a.hasta ? ` (hasta ${a.hasta}%)` : ''}</td><td>${a.osm}</td></tr>`).join('')}</table></div>`;
  },
};
function runCalc(box) { const f = CALC[box.dataset.calc]; if (f) f(box); }

// =====================================================================
// PROTOCOLO (contenido íntegro)
// =====================================================================
// Protocolo completo e infografía en PDF (carpeta Protocolo/)
const PDFS = [   // [título, descripción, PDF, clave de las páginas en Protocolo/paginas/ (scripts/paginas_app.sh)]
  ['Formato normal', '13 páginas', 'Protocolo/Protocolo hipoglucemia en recién nacidos (nuevo diseño).pdf', 'normal'],
  ['Formato revista', '8 páginas, a dos columnas', 'Protocolo/Protocolo hipoglucemia en recién nacidos (formato revista).pdf', 'revista'],
  ['Infografía', 'Resumen visual en una página (A3 apaisado)', 'Protocolo/Infografía hipoglucemia en recién nacidos.pdf', 'infografia'],
];
function pdfCard() {
  return `<div class="card navy"><span class="step">Documento completo</span><h2>Protocolo en PDF e infografía</h2>
    ${PDFS.map(([t, d], i) => `<div class="dose"><div class="what"><b>${t}</b><small>${d}</small></div>
      <div class="row"><button type="button" class="btn small ghost" data-ver="${i}">Ver</button><button type="button" class="btn small" data-descargar="${i}">Descargar</button></div></div>`).join('')}</div>`;
}

function renderProto() {
  const T1 = `<div class="tbl-wrap"><table>
    <tr><th></th><th colspan="2">Hipoglucemia precoz</th><th>Hipoglucemia persistente</th></tr>
    <tr><th></th><th>&lt; 24 h de vida</th><th>24-72 h de vida</th><th>≥ 72 h de vida</th></tr>
    <tr><td class="l hipo">Umbral diagnóstico (mg/dL)</td><td class="hipo">&lt; 40 mg/dL</td><td class="hipo">&lt; 46 mg/dL</td><td class="hipo">&lt; 50 mg/dL</td></tr>
    <tr><td class="l ok">Objetivo terapéutico (mg/dL)</td><td class="ok">≥ 40 mg/dL</td><td class="ok">≥ 46 mg/dL</td><td class="ok">&gt; 60 mg/dL</td></tr>
    <tr><td class="l amb">Límite superior</td><td class="amb" colspan="3">90-100 mg/dL</td></tr></table></div><p class="tbl-note">Tabla 1. Valores de hipoglucemia precoz y persistente, y glucemia objetivo.</p>`;
  const OSM = { 5: 277, 7.5: 416, 10: 555, 12.5: 693, 15: 833, 20: 1110 };
  const T5 = `<div class="tbl-wrap"><table><tr><th>mL/kg/día<br><small>(mL/kg/h)</small></th>${[5, 7.5, 10, 12.5, 15, 20].map(c => `<th>Glucosado ${fmt(c, c % 1 ? 1 : 0)} %<br><small>(${OSM[c]} mOsm/L)</small></th>`).join('')}</tr>
    ${[60, 80, 100, 120, 140, 160, 180, 200].map(f => `<tr><td><b>${f}</b> <small>(${fmt(f / 24, 1)})</small></td>${[5, 7.5, 10, 12.5, 15, 20].map(c => { const v = gir(c, f / 24); return `<td class="${(c === 10 && (f === 60 || f === 80)) ? 'ok' : v > 10 ? 'warn' : ''}">${fmt(v, 1)}</td>`; }).join('')}</tr>`).join('')}</table></div>
    <p class="tbl-note">Tabla 5. Aportes de glucosa según la concentración y el ritmo del suero pautado. <span style="color:var(--ok);font-weight:700">En verde</span>: aportes iniciales típicos del RN. <span style="color:var(--warn);font-weight:700">En naranja</span>: con aportes &gt; 10-12 mg/kg/min, valorar ampliar el estudio y/o asociar tratamiento farmacológico.</p>`;
  const sec = (n, t, body) => `<details class="sec"><summary><span class="n">${n}</span>${t}</summary><div class="body">${body}</div></details>`;
  const ul = (a) => `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
  $('#tab-proto').innerHTML = `${pdfCard()}
    <input class="search" id="p-search" type="search" placeholder="Buscar en el protocolo… (p. ej. glucagon, dosis gel)" aria-label="Buscar en el protocolo" autocapitalize="none" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="search">
    <div id="p-secs">
    ${sec('Ab', 'Abreviaturas', `<div class="tbl-wrap"><table>${[['ABL', 'Analizador de gasometría (glucemia en muestra de sangre completa)'], ['CIR', 'Restricción del crecimiento intrauterino'], ['GH', 'Hormona de crecimiento'], ['IGF-1', 'Factor de crecimiento similar a la insulina tipo 1'], ['IGFBP-3', 'Proteína transportadora 3 del factor de crecimiento similar a la insulina'], ['IV', 'Intravenoso'], ['Pro-IGF-II', 'Precursor del factor de crecimiento similar a la insulina tipo 2'], ['RN', 'Recién nacido'], ['SG', 'Suero glucosado']].map(([a, b]) => `<tr><td class="l"><b>${a}</b></td><td class="l">${b}</td></tr>`).join('')}</table></div>`)}
    ${sec('1', 'Introducción', `<p>La hipoglucemia es la alteración metabólica más frecuente en el periodo neonatal; afecta al 5-7 % de los RN a término y al 3,2-14,7 % de los pretérmino, y puede llegar hasta el 50 % de los RN con factores de riesgo.</p>
      <p>Sin embargo, no existen datos suficientes para definir una cifra de glucemia por debajo de la cual habría que intervenir para prevenir la morbilidad. Esto explica que los porcentajes de incidencia de hipoglucemia referidos en las diversas series y estudios estén sujetos a variación. En el presente documento se proponen unos valores para definir la hipoglucemia precoz y persistente.</p>
      <p>La consecuencia más temida de la hipoglucemia en el RN es el daño neurológico a corto y largo plazo, cuyo riesgo es mayor cuando la hipoglucemia es sintomática. De ahí la importancia de alimentar precozmente a los RN con riesgo de hipoglucemia, así como la determinación seriada de glucemia para detectar la hipoglucemia y tratarla precozmente.</p>`)}
    ${sec('2', 'Objetivos', `<ol><li>Establecer los valores de glucemia que definen la hipoglucemia neonatal.</li><li>Reconocer los factores de riesgo de hipoglucemia neonatal.</li><li>Prevenir la hipoglucemia sintomática en los RN con factores de riesgo.</li><li>Evitar tratamientos innecesarios en los RN durante el nadir fisiológico.</li><li>Actualizar el manejo de la hipoglucemia en el RN.</li><li>A largo plazo: prevenir las secuelas neurológicas por hipoglucemia.</li></ol>`)}
    ${sec('3', 'Ámbito de aplicación y población diana', `<p>Este protocolo se aplica a los RN de 35 o más semanas de gestación con factores de riesgo de hipoglucemia y a los RN que presenten hipoglucemia, atendidos en el Paritorio, la Maternidad y la Unidad Neonatal del Hospital de Montilla.</p><p>El manejo de la hipoglucemia persistente (más allá de las 72 horas de vida) se recoge en el anexo 3.</p>`)}
    ${sec('4', 'Profesionales implicados', `<p>Pediatras, matronas, personal de enfermería y técnicos en cuidados auxiliares de enfermería (TCAE) del Paritorio, la Maternidad y la Unidad Neonatal.</p>`)}
    ${sec('5', 'Definiciones', `<p>Durante la transición normal a la vida extrauterina en el RN a término, la concentración de glucosa sanguínea disminuye durante las dos primeras horas tras el parto, momento en que alcanza su nadir, con una glucemia media de aproximadamente 55 mg/dL y un 95 % de los valores por encima de 25 mg/dL. La concentración de glucosa aumenta progresivamente hasta situarse entre 45 y 80 mg/dL en las primeras 48 horas de vida. Es importante diferenciar esta respuesta fisiológica de la hipoglucemia persistente o recurrente.</p>
      <p>En la tabla siguiente se recogen los valores de hipoglucemia precoz y persistente, así como la glucemia objetivo.</p>${T1}`)}
    ${sec('6', 'Factores de riesgo para hipoglucemia', `<p>A continuación, se detallan los factores que aumentan el riesgo de presentar hipoglucemia en el periodo neonatal:</p>${ul(FACTORES.map(f => f[1]))}
      <div class="note-box">Los RN con factores de riesgo de hipoglucemia deben iniciar la alimentación precozmente. En los RN de riesgo asintomáticos, la primera glucemia capilar se determinará a las 2 horas de vida, coincidiendo con la alimentación. Si el RN presenta síntomas compatibles con hipoglucemia, la glucemia se determinará inmediatamente, sin esperar a las 2 horas.<br><br>Posteriormente, se realizarán controles de glucemia capilar cada 3-6 horas, generalmente antes de las tomas, durante las primeras 24-48 horas de vida (periodo con mayor riesgo de hipoglucemia), hasta que al menos tres mediciones alcancen el objetivo terapéutico.</div>`)}
    ${sec('7', 'Síntomas sugerentes de hipoglucemia', `<p>La hipoglucemia puede manifestarse con alguno de los síntomas que se detallan a continuación, aunque hay que tener en cuenta que los RN con hipoglucemia con frecuencia se encuentran <b>asintomáticos</b>, de ahí la recomendación de realizar controles seriados de glucemia en los RN de riesgo.</p>
      <ul><li><b>Síntomas adrenérgicos (activación del sistema nervioso autónomo)</b>: ${ul(['Temblores.', 'Sudoración.', 'Irritabilidad.', 'Taquipnea.', 'Palidez.'])}</li>
      <li><b>Síntomas de neuroglucopenia</b>: ${ul(['Mala alimentación.', 'Succión débil.', 'Llanto débil o agudo.', 'Cambios en el nivel de conciencia.', 'Hipotonía.', 'Convulsiones.'])}</li>
      <li><b>Otros</b>: ${ul(['Apnea.', 'Bradicardia.', 'Cianosis.', 'Hipotermia.'])}</li></ul><p class="tbl-note">Tabla 2. Síntomas sugerentes de hipoglucemia.</p>`)}
    ${sec('8', 'Algoritmo de actuación ante la hipoglucemia precoz', `<button type="button" class="fig-btn" data-ver-img="img/algoritmo.png" data-titulo="Algoritmo de actuación" aria-label="Ampliar el algoritmo"><img class="fig" src="img/algoritmo.png" alt="Algoritmo de actuación ante la hipoglucemia precoz" loading="lazy"></button><p class="tbl-note">Toque la imagen para ampliarla.</p>
      <div class="note-box"><sup><b>1</b></sup> La glucemia capilar debe confirmarse lo antes posible con una muestra de sangre venosa, que ha de procesarse con rapidez para evitar valores falsamente bajos (los eritrocitos de la muestra consumen glucosa). No obstante, el tratamiento debe iniciarse sin esperar a la confirmación.<br>La glucemia capilar es aproximadamente un 15 % más baja que la plasmática.<br>Para la determinación de la glucemia capilar, emplear preferiblemente el dispositivo de punción automático (pinchador), disponible tanto en Paritorio como en la Unidad Neonatal, en lugar de lanceta o aguja intramuscular.</div>
      <div class="note-box"><sup><b>2</b></sup> Administrar primero el gel de dextrosa y posteriormente ofrecer la toma. Si no se dispone de dicho gel, colocar al pecho si la madre desea lactancia materna, o bien dar una toma de fórmula de inicio (5 mL/kg).</div>
      <div class="note-box"><sup><b>3</b></sup> Si hay retraso en conseguir un acceso venoso, administrar 0,5 mL/kg de gel de dextrosa al 40 %.</div>
      <div class="note-box"><sup><b>4</b></sup> En caso de hipoglucemia grave (&lt; 30 mg/dL) o si persiste la hipoglucemia &lt; 50 mg/dL a pesar de estar administrando la dosis máxima de glucosa intravenosa en infusión continua, valorar administrar una dosis de glucagón (20-30 µg/kg; máximo 1 mg) intramuscular, subcutánea o en bolo lento intravenoso (en un minuto); se puede repetir a los 20 minutos si no hay respuesta. No se recomienda en RN pequeños para la edad gestacional ni en prematuros, por sus escasas reservas de glucógeno.</div>
      <div class="note-box"><sup><b>5</b></sup> Administrar una segunda dosis de gel de dextrosa y posteriormente ofrecer una toma de 5 mL/kg de fórmula de inicio; después de esta toma, si la madre desea lactancia materna, colocar al pecho. En caso de no disponer de gel de dextrosa al 40 %, dar una toma de fórmula de inicio (8 mL/kg) y posteriormente, si la madre desea lactancia materna, colocar al pecho.</div>
      <div class="note-box"><sup><b>6</b></sup> Considerar suspender los controles de glucemia cuando se cumplan ambas condiciones:<br>a) al menos tres controles seguidos ≥ 46 mg/dL con adecuada tolerancia oral; y<br>b) haber completado el periodo mínimo de vigilancia: 12 horas en hijos de madre diabética y grandes para la edad gestacional, y 24 horas en pequeños para la edad gestacional y prematuros.<br>Antes del alta de los RN que no han precisado aportes intravenosos (con al menos 48 horas de vida): si la glucemia está entre 45 y 50 mg/dL, asegurar aportes y comprobar que la glucemia supera los 50 mg/dL tras ellos.</div>`)}
    ${sec('9', 'Bibliografía', `<ol style="word-break:break-word">
      <li>Fuente Lucas G, Montoro Cremades D. Manejo de la hipoglucemia precoz en RN con factores de riesgo [protocolo interno no publicado]. Abril-mayo de 2021.</li>
      <li>Rozance PJ. Management and outcome of neonatal hypoglycemia. En: UpToDate [Internet]. Waltham (MA): UpToDate Inc.; 2022 [última actualización: 12 jul 2022; consultado: mar 2023]. Disponible en: https://www.uptodate.com</li>
      <li>Rozance PJ. Pathogenesis, screening, and diagnosis of neonatal hypoglycemia. En: UpToDate [Internet]. Waltham (MA): UpToDate Inc.; 2021 [última actualización: 20 dic 2021; consultado: mar 2023]. Disponible en: https://www.uptodate.com</li>
      <li>Narvey MR, Marks SD; Canadian Paediatric Society, Fetus and Newborn Committee. The screening and management of newborns at risk for low blood glucose. Paediatr Child Health. 2019;24(8):536-54. doi:10.1093/pch/pxz134 [actualizado: 28 mar 2025]. Disponible en: <a href="https://cps.ca/en/documents/position/newborns-at-risk-for-low-blood-glucose" target="_blank" rel="noopener">cps.ca</a></li>
      <li>Committee on Fetus and Newborn; Adamkin DH. Postnatal glucose homeostasis in late-preterm and term infants. Pediatrics. 2011;127(3):575-9. doi:10.1542/peds.2010-3851</li>
      <li>Wight NE; Academy of Breastfeeding Medicine. ABM Clinical Protocol #1: Guidelines for glucose monitoring and treatment of hypoglycemia in term and late preterm neonates, revised 2021. Breastfeed Med. 2021;16(5):353-65. doi:10.1089/bfm.2021.29178.new</li>
      <li>British Association of Perinatal Medicine. Identification and management of neonatal hypoglycaemia in the full term infant (birth – 72 hours) [Internet]. Londres: BAPM; 2024. Disponible en: <a href="https://www.bapm.org/resources/identification-and-management-of-neonatal-hypoglycaemia-in-the-full-term-infant-birth-72-hours" target="_blank" rel="noopener">bapm.org</a></li>
      <li>Harris DL, Weston PJ, Signal M, Chase JG, Harding JE. Dextrose gel for neonatal hypoglycaemia (the Sugar Babies Study): a randomised, double-blind, placebo-controlled trial. Lancet. 2013;382(9910):2077-83. doi:10.1016/S0140-6736(13)61645-1</li></ol>`)}
    ${sec('A1', 'Anexo 1 · Gel oral de dextrosa al 40 %', `<p>Se considera tratamiento de primera línea en el RN con <b>hipoglucemia precoz</b> asintomática, ya que:</p><p>- Existe evidencia de que reduce la separación madre-hijo por ingreso para tratamiento e incrementa la probabilidad de lactancia materna exclusiva al alta.<br>- Es una medida coste-efectiva y segura.</p>
      <p><b>Fórmula magistral:</b></p><div class="tbl-wrap"><table>
      <tr><td class="l"><b>Nombre</b></td><td class="l">Glucosa 40 % gel oral</td></tr><tr><td class="l"><b>Forma farmacéutica</b></td><td class="l">Gel para mucosa oral</td></tr><tr><td class="l"><b>Presentación</b></td><td class="l">Jeringas precargadas de 3 mL</td></tr>
      <tr><td class="l"><b>Composición</b></td><td class="l">Glucosa 100 g<br>Carboximetilcelulosa 2,5 g (espesante)<br>Agua conservans c.s.p. 250 mL (parabenos)</td></tr><tr><td class="l"><b>Propiedades</b></td><td class="l">Viscosa, incolora e inodora</td></tr><tr><td class="l"><b>Conservación</b></td><td class="l">Conservar en nevera (2-8 °C)</td></tr><tr><td class="l"><b>Caducidad</b></td><td class="l">1 mes</td></tr></table></div><p class="tbl-note">Tabla 3. Fórmula magistral del gel oral de dextrosa al 40 %.</p>
      <p><b>Modo de administración:</b><br>- Secar la boca del RN con una gasa.<br>- Aplicar el gel en la mucosa yugal y masajear la mejilla del RN durante unos segundos.</p>
      <p><b>Dosis:</b><br>- Primera dosis: 0,5 mL/kg (200 mg/kg) y, después, colocar al pecho si la madre desea lactancia materna, o bien dar una toma de fórmula de inicio (5 mL/kg). Repetir glucemia capilar a los 30 minutos.<br>- Segunda dosis: si persiste la hipoglucemia y el RN sigue asintomático, repetir la misma dosis y posteriormente ofrecer una toma de 5 mL/kg de fórmula de inicio; después de esta toma, si la madre desea lactancia materna, colocar al pecho.<br>- Si tras la segunda dosis persiste la hipoglucemia, está indicado el ingreso.</p>
      <p>- Si el RN presenta un segundo episodio de hipoglucemia se pueden administrar hasta 2 dosis más de gel de dextrosa.<br>- En caso de un tercer episodio está indicado el ingreso.</p>`)}
    ${sec('A2', 'Anexo 2 · Tratamiento con glucosa intravenosa', `<p><b>1. Criterios para iniciar tratamiento con glucosa intravenosa:</b></p><p>1.1. RN con hipoglucemia <b>sin posibilidad de alimentación enteral</b>.<br>1.2. RN con hipoglucemia y <b>síntomas moderados o graves</b>.<br>1.3. RN con hipoglucemia <b>asintomática y glucemia &lt; 30 mg/dL</b> tras una <b>primera corrección</b> con gel de dextrosa y toma (pecho o fórmula de inicio 5 mL/kg).<br>1.4. RN con hipoglucemia <b>asintomática y glucemia &lt; 40 mg/dL (0-24 h) o &lt; 46 mg/dL (24-72 h)</b> tras una <b>segunda corrección</b> (gel de dextrosa y toma de fórmula de inicio de 5 mL/kg o, si no se dispone de gel, toma de fórmula de inicio de 8 mL/kg; véanse la nota 5 del algoritmo y el anexo 1).</p>
      <p><b>2. Dosis</b>:</p><p>2.1. Iniciar con <b>suero glucosado al 10 % a 80 mL/kg/día</b> (5,6 mg/kg/min de glucosa).<br>2.2. Reservar la administración de <b>bolos</b> de glucosa para las hipoglucemias <b>sintomáticas:</b> 200 mg/kg (2 mL/kg de suero glucosado 10 %) en 5-10 minutos.<br>2.3. Aporte total máximo de líquidos en las primeras 72 h de vida (intravenoso y oral): 100 mL/kg/día (para prevenir la hiponatremia).<br>2.4. Medir la glucosa (capilar inicialmente, y comprobar con venosa según cifras y evolución) a los 30-45 minutos de iniciada la infusión de glucosa intravenosa, y 30-45 minutos después de cada modificación de dosis.<br>2.5. El límite superior de glucemia recomendado es <b>90-100 mg/dL</b>.<br>2.6. Si son necesarios aportes superiores a 10-12 mg/kg/min o 160 mL/kg/día, considerar otras opciones terapéuticas.</p>
      <p><b>3. Guía para el ajuste de aportes intravenosos</b></p><div class="tbl-wrap"><table><tr><th>Glucemia preprandial (mg/dL)</th><th>Variación en la perfusión de glucosa (mg/kg/min)</th></tr>
      <tr><td class="hipo">50-60</td><td class="hipo">Disminuir 0,4</td></tr><tr><td class="hipo">60-70</td><td class="hipo">Disminuir 0,8</td></tr><tr><td class="hipo">70-90</td><td class="hipo">Disminuir 1,2</td></tr><tr><td class="hipo">&gt; 90</td><td class="hipo">Disminuir 1,6</td></tr><tr><td class="ok">&lt; 40</td><td class="ok">Aumentar 0,8</td></tr><tr><td class="ok">40-50</td><td class="ok">Aumentar 0,4 (solo si la previa fue &lt; 50 mg/dL)</td></tr></table></div><p class="tbl-note">Tabla 4. Guía para el ajuste de aportes intravenosos.</p>
      <p>✴ Límite superior de glucemia 90-100 mg/dL.<br>✴ 0,4 mg/kg/min equivalen a 0,25 mL/kg/h de suero glucosado al 10 %.<br>✴ En RN de más de 72 horas, con glucemias de 50-60 mg/dL mantener el aporte hasta alcanzar el objetivo de &gt; 60 mg/dL.</p>
      <p><b>4. Fórmula</b> para calcular los aportes de glucosa en mg/kg/min a partir de un ritmo de gotero con una concentración conocida: <b>%SG × ritmo (mL/kg/h) / 6</b></p>
      <p><b>5. Tabla de aportes de glucosa según la concentración y el ritmo del suero pautado</b></p>${T5}
      <p>6. <b>Retirada</b>: iniciar tras 12 horas de estabilidad de las glucemias (objetivo a las 24-72 h ≥ 46 mg/dL y a partir de las 72 h &gt; 60 mg/dL), lentamente y con controles de glucemia capilar 30 minutos tras cada modificación.</p>
      <p>7. <b>Alta</b> (RN que han recibido glucosa intravenosa): comprobar que se mantienen glucemias &gt; 60 mg/dL preprandiales en al menos tres tomas.</p>
      <p><b>8. Tabla resumen de la osmolaridad máxima soportada en función del tipo de acceso vascular</b></p><div class="tbl-wrap"><table><tr><th class="l">Acceso vascular</th><th>Concentración máxima</th><th>Osmolaridad (mOsm/L)</th></tr>
      <tr><td class="l"><b>Vía periférica</b></td><td>12,5 % (hasta 15 %)</td><td>694 (833)</td></tr><tr><td class="l"><b>Catéter venoso umbilical en posición baja (flujo libre)</b></td><td>12,5 %</td><td>694</td></tr><tr><td class="l"><b>Catéter venoso central (incluye umbilical)</b></td><td>25 %</td><td>1388</td></tr><tr><td class="l"><b>Catéter arterial umbilical (<span style="color:var(--hipo)">no recomendado</span>; solo hasta disponer de vía venosa)</b></td><td>12,5 %</td><td>694</td></tr></table></div><p class="tbl-note">Tabla 6. Osmolaridad máxima soportada en función del tipo de acceso vascular.</p>`)}
    ${sec('A3', 'Anexo 3 · “Muestra crítica” en hipoglucemia persistente', `<p>Ante una hipoglucemia &lt; 50 mg/dL después de las 72 horas de vida, extraer <b><i>muestra crítica</i></b> de sangre.</p><p>La extracción debe realizarse durante la hipoglucemia, ya sea espontánea o inducida por un ayuno controlado.</p>
      <div class="tbl-wrap"><table><tr><th>Muestra</th><th>Determinaciones</th></tr>
      <tr><td class="l hipo" style="vertical-align:top"><b>Sangre:</b><br><span style="font-weight:400;color:var(--ink)">Congelar la mayor cantidad posible de suero/plasma, para estudios posteriores.</span></td><td class="l">- Glucosa.<br>- Otros metabolitos: Beta-hidroxibutirato. Ácidos grasos libres. Lactato. Piruvato. Glicerol. Alanina.<br>- Función hepática y amonio.<br>- Gasometría, ionograma (hiato aniónico).<br>- Insulina, péptido C.<br>- Cortisol, hormona de crecimiento (GH).<br>- Carnitina (total y esterificada).<br>- Acilcarnitinas.<br>- Ocasionalmente (no requieren extracción en hipoglucemia): Aminoácidos. IGFBP-3. IGF-1. Pro-IGF-II. Tiroxina libre, tirotropina. Isoformas de transferrina.</td></tr>
      <tr><td class="l amb" style="vertical-align:top"><b>Orina</b>:<br><span style="font-weight:400;color:var(--ink)">Congelar una alícuota de la primera micción tras la hipoglucemia.</span></td><td class="l">- pH, iones.<br>- Cuerpos cetónicos.<br>- Sustancias reductoras.<br>- Ácidos orgánicos.<br>- Perfil de acilglicinas.</td></tr></table></div><p class="tbl-note">Tabla 7. Determinaciones de la “muestra crítica” en sangre y orina.</p>`)}
    </div>`;
}

// Búsqueda tolerante: sin distinguir mayúsculas/minúsculas ni acentos (gluCAGON = glucagón,
// nino = niño) y con varias palabras en cualquier orden («dosis gel» encuentra «gel… dosis»).
// fold() conserva la longitud del texto carácter a carácter para poder resaltar en el original.
function fold(str) {
  let out = '';
  for (const ch of str) {
    const f = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    out += ch.length === 1 ? (f[0] || ch) : ch;   // mantiene la misma longitud que el original
  }
  return out;
}
function searchProto(q) {
  const terms = fold(q).split(/\s+/).filter(t => t.length > 0);
  let first = true;   // con búsqueda: se muestran los apartados que coinciden y solo se abre el primero
  $$('#p-secs details.sec').forEach(d => {
    $$('mark', d).forEach(m => m.replaceWith(document.createTextNode(m.textContent)));
    d.normalize();
    if (!terms.length) { d.hidden = false; d.open = false; return; }
    const txt = fold(d.textContent);
    const hit = terms.every(t => txt.includes(t));
    d.hidden = !hit; d.open = hit && first;
    if (hit) first = false;
    if (!hit) return;
    // resaltar todas las apariciones de cada término (de atrás hacia delante para no desplazar posiciones)
    const walker = document.createTreeWalker(d, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const f = fold(n.textContent), spans = [];
      terms.filter(t => t.length > 1).forEach(t => { let i = f.indexOf(t); while (i >= 0) { spans.push([i, i + t.length]); i = f.indexOf(t, i + t.length); } });
      spans.sort((x, y) => x[0] - y[0]);
      const merged = [];
      spans.forEach(sp => { const last = merged[merged.length - 1]; if (last && sp[0] <= last[1]) last[1] = Math.max(last[1], sp[1]); else merged.push(sp.slice()); });
      for (let k = merged.length - 1; k >= 0; k--) {
        const r = document.createRange(); r.setStart(n, merged[k][0]); r.setEnd(n, merged[k][1]);
        r.surroundContents(document.createElement('mark'));
      }
    });
  });
}

// =====================================================================
// INFO
// =====================================================================
function renderInfo() {
  $('#tab-info').innerHTML = `
    <div class="card navy"><span class="step">Protocolo de actuación</span><h2>Protocolo de hipoglucemia en el recién nacido</h2>
      <p class="lead">Servicio de Pediatría · Hospital de Montilla</p>
      <p class="lead" style="margin-top:-4px">App: versión ${APP_VERSION.num} · ${APP_VERSION.fecha} · autora: María Luisa Becerra, Pediatra · <button type="button" class="linklike" data-portada>Ver la portada</button></p>
      <div class="kpis"><div class="kpi"><div class="k">Versión</div><div class="v" style="font-size:20px">Edición 01</div><div class="s">06/10/2026</div></div><div class="kpi"><div class="k">Edición anterior</div><div class="v" style="font-size:20px">Edición 00</div><div class="s">25/03/2023</div></div></div>
      <p><b>Elaborado:</b> María Luisa Becerra Martínez y Marta Cruz Cañete, Facultativas Especialistas de Área (FEA) de Pediatría, Hospital de Montilla.<br><b>Revisado:</b> Francisca Luisa Gallardo Hernández, Jefa de Sección de Pediatría, Hospital de Montilla.</p></div>
    <div class="card amb"><span class="step">Importante</span><h2>Uso de esta herramienta</h2>
      <ul class="clean"><li>Es una herramienta de <b>apoyo</b> que reproduce el protocolo del Servicio. <b>No sustituye al juicio clínico</b> ni a la valoración individual de cada paciente.</li>
      <li>Compruebe siempre las dosis antes de administrarlas.</li>
      <li>Los cálculos de aportes de glucosa se realizan con la fórmula del Anexo 2 (punto 4).</li>
</ul></div>
    <div class="card ok"><span class="step">Privacidad</span><h2>Ningún dato sale del dispositivo</h2>
      <p>Los datos que se introducen (peso, horas de vida, glucemias…) solo se usan para los cálculos en pantalla. No se guardan ni se envían a ningún servidor. Al pulsar «Nuevo paciente» o cerrar la página se borran.</p></div>
    <div class="card"><span class="step">Instalación</span><h2>Usarla como una app</h2>
      <p><b>iPhone / iPad (Safari):</b> botón Compartir → «Añadir a pantalla de inicio».<br><b>Android (Chrome):</b> menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».<br><b>Ordenador (Chrome / Edge):</b> icono de instalar en la barra de direcciones.</p>
      <p class="lead">Una vez abierta, funciona también sin conexión.</p></div>
    <div class="card"><span class="step">Historial</span><h2>Versiones de la app</h2>
      <p class="lead">El protocolo completo, en PDF, y la infografía están en la pestaña <b>Protocolo</b>.</p>
      <ol class="versiones">${NOVEDADES.map((v, i) => `<li${i === 0 ? ' class="actual"' : ''}><div class="v-cab"><b>Versión ${v.version}</b>${i === 0 ? ' <span class="v-tag">actual</span>' : ''}<span class="v-fecha">${v.fecha}</span></div>
        <div class="v-tit">${esc(v.titulo)}</div><ul class="clean">${v.cambios.map(c => `<li>${esc(c)}</li>`).join('')}</ul></li>`).join('')}</ol></div>`;
}

// =====================================================================
// Eventos
// =====================================================================
function showTab(name) {
  $$('.tab').forEach(t => t.setAttribute('aria-current', t.dataset.tab === name ? 'page' : 'false'));
  $$('.panel').forEach(p => { p.hidden = p.id !== `tab-${name}`; });
  try { localStorage.setItem('hipo-tab', name); } catch (e) { /* sin almacenamiento */ }
  window.scrollTo({ top: 0 });
}

let lastSnap = '', debounce = null;
function rerenderFlowKeepingFocus(force = false) {
  const snap = JSON.stringify(S);
  if (!force && snap === lastSnap) return;   // nada cambió: no se reconstruye (evita perder el toque en un botón)
  lastSnap = snap;
  const id = document.activeElement && document.activeElement.id;
  renderFlow();
  if (id) { const el = document.getElementById(id); if (el) { el.focus(); if (el.setSelectionRange && el.value) { try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* tipo sin selección */ } } } }
  $$('#flow [data-calc]').forEach(runCalc);
}

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab'); if (tab) { showTab(tab.dataset.tab); return; }
  const t = e.target.closest('[data-timer]');
  if (t) { if (t.dataset.timer === 'stop') stopTimer(); else startTimer(Number(t.dataset.timer), t.dataset.label); return; }
  const segBtn = e.target.closest('#tab-guia .seg[data-seg] button');
  if (segBtn) {
    const key = segBtn.parentElement.dataset.seg; S[key] = segBtn.dataset.v;
    if (key === 'oral') Object.assign(S, { g1: null, g2: null, tol: null, g3: null });
    syncSeg(); rerenderFlowKeepingFocus(); return;
  }
  if (e.target.closest('[data-act="reset"]')) {
    resetState(); renderGuiaBase(); rerenderFlowKeepingFocus(true); stopTimer(); window.scrollTo({ top: 0 });
  }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.id === 'p-search') { searchProto(el.value); return; }
  const box = el.closest('[data-calc]'); if (box) { runCalc(box); return; }
  if (el.matches('#tab-guia [data-s]')) {
    S[el.dataset.s] = num(el.value);
    if (['peso', 'horas', 'eg'].includes(el.dataset.s)) renderSummary();
    clearTimeout(debounce); debounce = setTimeout(() => rerenderFlowKeepingFocus(), 700);
  }
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('#tab-guia [data-s]')) { S[el.dataset.s] = num(el.value); rerenderFlowKeepingFocus(); return; }
  if (el.matches('#tab-guia [data-f]')) { S.factores[el.dataset.f] = el.checked; rerenderFlowKeepingFocus(); return; }
  if (el.id === 'g-gel') { S.gel = el.checked; rerenderFlowKeepingFocus(); return; }
  const box = el.closest('[data-calc]'); if (box) runCalc(box);
});
// Protocolo en acordeón: solo un apartado abierto a la vez
document.addEventListener('toggle', (e) => {
  const d = e.target;
  if (!d.matches || !d.matches('#p-secs details.sec') || !d.open) return;
  $$('#p-secs details.sec').forEach(o => { if (o !== d && o.open) o.open = false; });
  requestAnimationFrame(() => {
    const r = d.getBoundingClientRect(), top = $('.topbar').getBoundingClientRect().bottom;
    if (r.top < top || r.top > window.innerHeight * 0.4) window.scrollTo({ top: window.scrollY + r.top - top - 10, behavior: 'smooth' });
  });
}, true);

// Intro en un campo de la guía = confirmar el valor
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('#tab-guia input[data-s]')) { e.preventDefault(); e.target.blur(); }
});

// =====================================================================
// Visor de documentos
// En una app instalada (sobre todo en iPhone) un PDF abierto ocupa la ventana y no hay forma de volver.
// Por eso los documentos se ven aquí como imágenes de sus páginas (Protocolo/paginas/, generadas con
// scripts/paginas_app.sh), con «Volver» siempre visible; el botón o gesto «Atrás» del móvil también lo cierra.
// =====================================================================
let PAGINAS = null;
const paginas = async () => PAGINAS || (PAGINAS = await fetch('Protocolo/paginas/paginas.json').then(r => r.json()));
const ZOOMS = [100, 150, 200, 300];
let visorZoom = 0;

function abrirVisor(titulo, imgs, i = null) {
  cerrarVisor(true);
  visorZoom = 0;
  const v = document.createElement('div');
  v.id = 'visor'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', titulo);
  v.innerHTML = `<div class="visor-bar">
      <button type="button" class="visor-volver" data-visor="cerrar">← Volver</button>
      <span class="visor-tit">${esc(titulo)}</span>
      <button type="button" class="visor-ic" data-visor="menos" aria-label="Reducir">−</button>
      <button type="button" class="visor-ic" data-visor="mas" aria-label="Ampliar">+</button>
      ${i != null ? `<button type="button" class="visor-ic" data-descargar="${i}" aria-label="Descargar el PDF">⤓</button>` : ''}
    </div>
    <div class="visor-body"><div class="visor-pags">${imgs.map((src, k) => `<img src="${encodeURI(src)}" alt="${esc(titulo)}${imgs.length > 1 ? ` · página ${k + 1} de ${imgs.length}` : ''}" ${k > 1 ? 'loading="lazy"' : ''}>`).join('')}</div></div>`;
  document.body.appendChild(v);
  document.documentElement.classList.add('visor-abierto');
  history.pushState({ visor: true }, '');
  v.querySelector('.visor-volver').focus();
}
function cerrarVisor(sinHistoria = false) {
  const v = $('#visor'); if (!v) return;
  v.remove(); document.documentElement.classList.remove('visor-abierto');
  if (!sinHistoria && history.state && history.state.visor) history.back();
}
function zoomVisor(d) {
  visorZoom = Math.max(0, Math.min(ZOOMS.length - 1, visorZoom + d));
  const p = $('#visor .visor-pags'); if (p) p.style.width = ZOOMS[visorZoom] + '%';
}
async function verDocumento(i) {
  const [t, , , clave] = PDFS[i];
  try {
    const n = (await paginas())[clave];
    abrirVisor(t, Array.from({ length: n }, (_, k) => `Protocolo/paginas/${clave}-${String(k + 1).padStart(2, '0')}.jpg`), i);
  } catch (e) { alert('No se ha podido abrir el documento. Compruebe la conexión e inténtelo de nuevo.'); }
}
// Descargar: en el móvil, menú «Compartir» del sistema (Guardar en Archivos, imprimir, enviar…), que no saca de la app;
// en el ordenador, descarga normal.
async function descargar(i) {
  const [t, , f] = PDFS[i], nombre = f.split('/').pop();
  const movil = matchMedia('(pointer: coarse)').matches;
  if (movil && navigator.canShare) {
    try {
      const blob = await fetch(f).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); });
      const file = new File([blob], nombre, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: t }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = encodeURI(f); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ver],[data-ver-img],[data-descargar],[data-visor]'); if (!b) return;
  e.preventDefault();
  if (b.dataset.ver != null) verDocumento(+b.dataset.ver);
  else if (b.dataset.verImg) abrirVisor(b.dataset.titulo || 'Imagen', [b.dataset.verImg]);
  else if (b.dataset.descargar != null) descargar(+b.dataset.descargar);
  else if (b.dataset.visor === 'cerrar') cerrarVisor();
  else if (b.dataset.visor === 'mas') zoomVisor(1);
  else if (b.dataset.visor === 'menos') zoomVisor(-1);
});
window.addEventListener('popstate', () => cerrarVisor(true));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#visor')) cerrarVisor(); });

// =====================================================================
// Arranque
// =====================================================================
renderGuiaBase(); rerenderFlowKeepingFocus(true); renderCalc(); renderProto(); renderInfo();
let startTab = 'guia';
try { startTab = localStorage.getItem('hipo-tab') || 'guia'; } catch (e) { /* sin almacenamiento */ }
showTab(['guia', 'calc', 'proto', 'info'].includes(startTab) ? startTab : 'guia');

// Portada: se muestra al abrir la app (una vez por sesión, para no repetirla al recargar tras actualizar).
{
  const p = $('#portada'), v = $('#portada-version');
  if (v) v.textContent = `Versión ${APP_VERSION.num} · ${APP_VERSION.fecha}`;
  const entrar = () => { p.hidden = true; try { sessionStorage.setItem('hipo-portada', '1'); } catch (e) { /* sin almacenamiento */ } };
  const mostrar = () => { p.hidden = false; $('#portada-entrar').focus(); };
  $('#portada-entrar').addEventListener('click', entrar);
  if (!p.hidden) $('#portada-entrar').focus();
  // Volver a la portada: tocando el logo o el título de la barra superior, o «Ver la portada» en Info
  document.addEventListener('click', (e) => { if (e.target.closest('.topbar .brand, [data-portada]')) mostrar(); });
  $('.topbar .brand').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); mostrar(); } });
}

// Actualizaciones (mismo patrón que HidratIV y DosisPed): la versión nueva espera instalada y se avisa con
// «Nueva versión disponible · Actualizar»; al pulsar, se activa y la página se recarga.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  let recargando = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recargando) { recargando = true; location.reload(); } });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) avisoActualizacion(reg);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) avisoActualizacion(reg); });
      });
      const comprobar = () => { reg.update().catch(() => { /* sin conexión: se comprobará más tarde */ }); };
      comprobar();
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') comprobar(); });   // al volver a la app (iPhone)
    }).catch(() => { /* sin modo sin conexión */ });
  });
}
function avisoActualizacion(reg) {
  if ($('.update-banner')) return;
  const b = document.createElement('div');
  b.className = 'update-banner'; b.setAttribute('role', 'status');
  b.innerHTML = '<span>Nueva versión disponible</span><button type="button">Actualizar</button>';
  b.querySelector('button').addEventListener('click', () => {
    b.querySelector('button').disabled = true; b.querySelector('span').textContent = 'Actualizando…';
    const recarga = () => { const u = new URL(location.href); u.searchParams.set('v', Date.now()); location.replace(u.toString()); };
    if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' }); else recarga();
    setTimeout(recarga, 4000);        // red de seguridad si no llega a cambiar el service worker
  });
  document.body.appendChild(b);
}
