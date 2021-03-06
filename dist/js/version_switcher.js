﻿//@file version_switcher.js
(function()
{
    'use strict';
    const VERSION_STRINGS = /([\d.]+)\/(docs\/)?api/;
    let switcher = undefined;
    let browser = chrome;
    class Switcher {
        constructor() {
            this.url = new URL(window.location.href);
            this.version = VERSION_STRINGS.exec(this.url.pathname);
            Object.seal(this);
        }
        generate() {
            (async() => {
                const response = await fetch(browser.extension.getURL("resources/template.html"));
                if(!response.ok){
                    consol.error(response);
                }
                const nav = document.createElement('div');
                nav.classList.add("addon_version_switcher_div");
                nav.innerHTML = await response.text();

                const select_box = nav.querySelector('select');
                // セレクトボックスの初期値を選択
                const current_version = Array.from(select_box.options).find(x => x.value === this.version[1]);
                if (current_version !== undefined){
                    current_version.selected = true;
                }
                // addEventHandler
                select_box.addEventListener('change', (e) => {
                    e.stopPropagation();
                    this.on_switch(e);
                }, false);
                window.addEventListener('scroll', (e) => {
                    let is_Hide = e.currentTarget.pageYOffset > 50;
                    if (is_Hide){
                        nav.classList.add('addon_version_switcher_hide');
                    }else{
                        nav.classList.remove('addon_version_switcher_hide');
                    }
                }, false);
                //const header = document.querySelector("#rightIframe");
                //const header = document.querySelector("ul.navList");
                const header = null;
                if (header === null){
                    document.body.prepend(nav);
                }else{
                    header.after(nav);
                }
            })();
            return this;
        }
        /**
         * @param {URL} href
         * @param {string} new_version
        */
        redirect_urls(href, new_version){
            /** regex test data.
                https://docs.oracle.com/javase/7/docs/api/java/util/ArrayList.html
                https://docs.oracle.com/javase/jp/9/docs/api/java/util/ArrayList.html
                https://docs.oracle.com/javase/jp/1.5.0/api/java/util/ArrayList.html
            */
            let pathname = href.pathname;
            const ar = ['/api', '/docs/api']
                .map(x => pathname.replace(VERSION_STRINGS, new_version + x))
                .filter((it, i, ar) => ar.indexOf(it) === i); // unique
            
            // i18n language codesだったら
            if ((pathname.split('/')[2] !== this.version[1])
                && (parseFloat(new_version) < 8) ) {
                    return ar;
            }
            //  docsを先頭に
            return ar.reverse();
        }
        /**
         * @param {URL[]} new_urls
        */
        to_redirect(new_urls){
            (async() => {
                const errs = new Map();
                for(let i=0;i<new_urls.length;i++) {
                    // リダイレクト先の存在チェック
                    const response = await fetch(new_urls[i]);
                    if(response.ok) {
                        window.location.href = response.url;
                    } else {
                        errs.set(response.url, response.status);
                    }
                }
                if(errs.length !== 0){
                    console.error(errs);
                }
            })();
        }
        on_switch(e) {
            const new_version = e.target.selectedOptions[0].value;
            const new_urls = this.redirect_urls(this.url, new_version).map(x => new URL(x, this.url.origin));
            this.to_redirect(new_urls);
        }
    }
    window.addEventListener('DOMContentLoaded', (e) => {
        switcher = new Switcher().generate();
    }, false);
})();