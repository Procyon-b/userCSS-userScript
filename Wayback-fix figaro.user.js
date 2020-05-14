// ==UserScript==
// @name         Wayback Machine - Images figaro.fr
// @namespace    https://github.com/Procyon-b
// @version      0.4
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

data=getData('script#__NEXT_DATA__');
var m2=data;

var st={}, imgOrder={}, yt={};
try{
  st=m2.props.pageProps.initialState;
  for (let k in st) {
    if (k.startsWith('resourceByUrlQuery')) {
      st=st[k].data.resourceByUrl.body.structured;
      break;
      }
    }

  for (let i=0, k=1, v=0; i<st.length; i++) {
    let t;
    if (t=st[i].image) {
      imgOrder[t.url.split('/').slice(-1) ]=k++;
      } 
    else if ((st[i].__typename=='Youtube') && (t=st[i].id) ) {
      yt[t]=v++;
      } 
    }
  
}catch(e){}

function findMedia(o) {
  var r;
  if (typeof o == 'object') for (let k in o) {
    if (typeof o[k] == 'object') r=findMedia(o[k]);
    if (k=='associatedMedia') r=o[k];
    if (r) return r;
    }
  }

if (m) {
  var e, img=document.querySelectorAll('figure > figcaption > span:first-child'),
    v=document.querySelectorAll('div.css-0 iframe');

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
      let k;
      if ( ( (m[i].caption===null) && (k=imgOrder[m[i].url.split('/').slice(-1)]) && (e=img[k]) ) ||
           (e=isMatch(m[i].caption)) ) {
        let im=document.createElement('img');
        im.src=m[i].url;
        try{
          let t=e.parentNode.parentNode.firstElementChild.firstElementChild;
          if (t.nodeName=='DIV') t.appendChild(im);
          }catch(e){}
        }
      }
    // youtube
    else if (m[i]['@type']=='VideoObject') {
      let re=/...\/(https:\/\/.*\/([^\/]+))$/.exec(m[i].embedUrl), p, f;
      if (re[1] && ((p=yt[re[2]])>=0) && (f=v[p]) ) {
        f.parentNode.parentNode.innerHTML='<a href="https://www.youtube.com/watch?v='+re[2]+'" target="_blank" title="Regarder la vidéo"><img src="https://web.archive.org/web/2/https://i1.ytimg.com/vi/'+re[2]+'/hqdefault.jpg"></a>';
        }
      }
    }

  }

})();
