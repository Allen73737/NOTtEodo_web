import { colors } from "@/content/generated/tokens";

/**
 * Runs before first paint (inlined in <head>): applies the saved theme and view so there is
 * never a flash of the wrong one. Stored values: nt-theme = light|dark|system, nt-view = cards|editorial.
 * Wrapped in try/catch because storage can throw (private mode, blocked site data).
 */
export const themeScript = `(function(){var d=document.documentElement;d.classList.remove('no-js');d.classList.add('js');
try{var t=localStorage.getItem('nt-theme');var v=localStorage.getItem('nt-view');
if(t==='light'||t==='dark'){d.dataset.theme=t;}
if(v==='cards'||v==='editorial'){d.dataset.view=v;}else{d.dataset.view='cards';}
if(localStorage.getItem('nt-motion')==='reduced'){d.classList.add('reduced');}}catch(e){d.dataset.view='cards';}
var dark=d.dataset.theme?d.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
var m=document.querySelector('meta[name="theme-color"]:not([media])');if(m)m.setAttribute('content',dark?'${colors.dark.canvas}':'${colors.light.canvas}');
if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('reduced');})();`;
