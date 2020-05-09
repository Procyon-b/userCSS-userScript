// ==UserScript==
// @name         Wayback Machine - Images figaro.fr
// @namespace    https://github.com/Procyon-b
// @version      0.3
// @description  Trouve les infos des images, corrige les tags IMG et charge ces images.
// @author       Achernar
// @match        https://web.archive.org/web/*/https://www.lefigaro.fr/*
// @grant        none
// @noframes
// ==/UserScript==

(function() {
"use strict";

function getData(s) {
  var d=document.querySelector(s);
  if (d) {
    try{
      return JSON.parse(d.innerText);
      }catch(e){}
    }
  }

var data=getData('script[type="application/ld+json"]');
var m=findMedia(data);
//console.info(m);

function findMedia(o) {
  var r;
  if (typeof o == 'object') for (let k in o) {
    if (typeof o[k] == 'object') r=findMedia(o[k]);
    if (k=='associatedMedia') r=o[k];
    if (r) return r;
    }
  }

if (m) {
  var e, img=document.querySelectorAll('figure > figcaption > span:first-child');
//console.info({img})

  function isMatch(s) {
    if (typeof s != 'string') return;
    s=s.trim().replace(/\s/gs, '');
    for (let i=0; i < img.length; i++) {
      let it=img[i].innerText;
      if (it) it=it.trim().replace(/\s/gs, '');
      if (it === s) return img[i];
      }
    }
  
  for (let i in m) {
    if (m[i]['@type']=='ImageObject') {
//console.info({mi:m[i]}, m[i].url);
      if (e=isMatch(m[i].caption)) {
//console.info('match',{e})
        let im=document.createElement('img');
        im.src=m[i].url;
        try{
          let t=e.parentNode.parentNode.firstElementChild.firstElementChild;
          if (t.nodeName=='DIV') t.appendChild(im);
          }catch(e){}
        }
      }
    }
  }

})();
