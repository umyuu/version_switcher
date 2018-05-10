//@version_switcher.js
(function()
{
    'use strict';
    const VERSION_STRINGS = /([\d.]+)\/(docs\/)?api/;
    let switcher = undefined;
    let browser = chrome;
    let template_html = undefined;

    class HtmlUtils {
        /**
         * @param {Map<string, string>} options
         * @param {string} selected
        */
        static create_selectBox(options, selected){
            const selectbox = document.createElement('select');
            // Todo:順序性は保証していない。
            for(let [key, value] of options){
                const opt = document.createElement('option');
                opt.text = key;
                opt.value = value;
                if(opt.text === selected){
                    opt.selected = true;
                }
                selectbox.appendChild(opt);
            }
            return selectbox;
        }
    }
    class Switcher {
        constructor() {
            this.docs = undefined;
            this.docs = new Map([["10", "10/1"], ["9", "9/1"], ["8", "8/1"]
            ,["7", "7/0"], ["6", "6/0"], ["1.5.0", "1.5.0/0"]]);
            this.url = new URL(window.location.href);
            this.version = VERSION_STRINGS.exec(this.url.pathname);
            Object.seal(this);
        }
        generate() {

            (async() => {
                const response = await fetch(browser.extension.getURL("resources/template.html"));
                const nav = document.createElement('div');
                nav.innerHTML = await response.text();
                const select_box = nav.children[0].children[0];
                Array.from(select_box.options).filter(x => x.text === this.version[1])[0].selected = true;

                select_box.addEventListener('change', (e) => {
                    this.on_switch(e);
                }, false);
                window.addEventListener('scroll', (e) => {
                    nav.setAttribute('display', e.currentTarget.pageYOffset > 50 ? 'none' : 'block');
                }, false);
                const header = document.querySelector("ul.navList");
                if (header === null){
                // Java 9 以前
                    document.body.prepend(nav);
                }else{
                    header.after(nav);
                }
            })();


            // セレクトボックスを作成して、hrefのバージョン情報より初期選択を行う。
            //const select_box = HtmlUtils.create_selectBox(this.docs, this.version[1]);
            //const nav = document.createElement("nav");
            //nav.className = "version_switcher";
            //nav.style = "";
            //nav.appendChild(document.createTextNode(" Java » "));
            //nav.appendChild(select_box);
            //nav.appendChild(document.createTextNode("ドキュメント"));
            //nav.appendChild(document.createElement("hr"));
            
            //let header = document.querySelector("ul.navList");
            //if (header === null){
                // Java 9 以前
            //    document.body.prepend(nav);
            //}else{
            //    header.after(nav);
            //}
            //
           // select_box.addEventListener('change', (e) => {
           //     this.on_switch(e);
           // }, false);
           // window.addEventListener('scroll', (e) =>{
           //     //nav.setAttribute('data-fixed', e.currentTarget.pageYOffset > 50 ? '1' : '0');
           //     nav.setAttribute('display', e.currentTarget.pageYOffset > 50 ? 'none' : 'block');
           //   }, false);
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
            let ar = ['/api', '/docs/api']
                .map(x => pathname.replace(VERSION_STRINGS, new_version + x))
                .filter((it, i, ar) => ar.indexOf(it) === i); // unique
            
            // i18n language codesだったら
            if (pathname.split('/')[2] !== this.version[1]) {
                if (parseInt(new_version) < 8) {
                    return ar;
                }
            }
            //  docsを先頭に
            return ar.reverse();
        }
        /**
         * @param {URL[]} new_urls
        */
        to_redirect(new_urls){
            (async() => {
                const errs = [];
                for(let i=0;i<new_urls.length;i++) {
                    // リダイレクト先の存在チェック
                    const response = await fetch(new_urls[i]);
                    if(response.ok) {
                        window.location.href = response.url;
                    } else {
                        errs.push(response);
                    }
                }
                if(errs.length !== 0){
                    console.error(errs.map(x => x.status + x.url));
                }
            })();
        }
        on_switch(e) {
            const new_version = e.target.selectedOptions[0].text;
            const new_urls = this.redirect_urls(this.url, new_version).map(x => new URL(x, this.url.origin));
            console.log(new_urls);
            this.to_redirect(new_urls);
        }
    }
    window.addEventListener('DOMContentLoaded', (e) => {
        switcher = new Switcher().generate();
        window.switcher = switcher;
    }, false);
})();