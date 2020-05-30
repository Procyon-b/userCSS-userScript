// ==UserScript==
// @name         Wayback Machine - Images figaro.fr
// @namespace    https://github.com/Procyon-b
// @version      0.5
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
function findMedia(o) {
  var r;
  if (typeof o == 'object') for (let k in o) {
    if (typeof o[k] == 'object') r=findMedia(o[k]);
    if (k=='associatedMedia') r=o[k];
    if (r) return r;
    }
  }

var data=getData('script[type="application/ld+json"]'), t;
var m=findMedia(data), v={};

if (m) {
  for (let i in m) {
    if (m[i]['@type']=='VideoObject') {
      let re=/...\/(https:\/\/.*?youtube.*?\/([^\/]+))$/.exec(m[i].embedUrl);
      if (re && re[2]) v[re[2]]=m[i];
      }
    }
  }


data=getData('script#__NEXT_DATA__');
var m2=data;

var st=[], imgOrder={}, yt={};
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


var doc=document.querySelector('div[data-component="fig-content-body"]');


// nouvelle méthode

function chk_iframe() {
  var w=this.contentWindow;
  try{
    if (w.document.title=='Wayback Machine') {
      w.document.body.innerHTML='Page non-archivée.<br>Cliquer <a target="_blank" href="'+w.location.href+'">ici</a> pour ouvrir et archiver.';
      w.document.body.classList='';
      }
    }catch(e){}
  }

var arch_date = (t=/^\/web\/(\d+)/.exec(location.pathname)) && t[1];

if (doc && (doc.children.length == st.length) ) {
  for (let i=0, e, d; e=doc.children[i], d=st[i]; i++) {
    switch (d.__typename) {
      case 'Photo':
        let im=document.createElement('img');
        im.src=d.image.url;
        try{
          let t=e.firstElementChild;
          if (t.nodeName=='DIV') t.appendChild(im);
          }catch(e){}
        break;
      case 'Youtube': try{
        let vid=v[d.id];
        let re=vid && /...\/(https:\/\/.*\/([^\/]+))$/.exec(vid.embedUrl);
        if (re[2]) {
          e.innerHTML='<a href="https://www.youtube.com/watch?v='+re[2]+'" target="_blank" title="Regarder la vidéo"><img src="https://web.archive.org/web/'+(arch_date||'2')+'/https://i1.ytimg.com/vi/'+re[2]+'/hqdefault.jpg"></a>';
          }
        }catch(e){}
        break;
      case 'Instagram': try{
        e.firstElementChild.innerHTML=d.sourceCode.replace(/(<iframe[^>]+src=")(https:\/\/www\.instagram\.com\/.*?")/s,"$1https://web.archive.org/web/"+(arch_date||'2')+"/$2");
        e.querySelector('iframe').onload=chk_iframe;
        }catch(e){}
        break;
      case 'Tweet': try{
        let re= /href="(https:\/\/twitter.com\/.*?)"/s.exec(d.sourceCode);
        e.querySelector('blockquote').parentNode.innerHTML='<a target="_blank" href="https://web.archive.org/web/'+(arch_date||'2')+'/'+re[1]+'">Ouvrir le tweet</a>';
        }catch(e){}
        break;
      }
    }
  }

// méthode précédente   (avant 2020-05-16)
else if (m) {
  var e, img=document.querySelectorAll('figure > figcaption > span:first-child'),
    V=document.querySelectorAll('div.css-0 iframe');

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
      if (re[1] && ((p=yt[re[2]])>=0) && (f=V[p]) ) {
        f.parentNode.parentNode.innerHTML='<a href="https://www.youtube.com/watch?v='+re[2]+'" target="_blank" title="Regarder la vidéo"><img src="https://web.archive.org/web/2/https://i1.ytimg.com/vi/'+re[2]+'/hqdefault.jpg"></a>';
        }
      }
    }

  }

})();
