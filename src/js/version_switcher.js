//@version_switcher.js
(function()
{
    'use strict';
    const URL_VERSION_PARTS = 3;
    let switcher = undefined;
    class HtmlUtils {
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
            this.docs = new Map([["10", "10/1"], ["9", "9/1"], ["8", "8/1"]
            ,["7", "7/0"], ["6", "6/0"], ["1.5.0", "1.5.0/0"]]);
            this.version_str = /([\d.]+)\/(docs)*/;
            this.version = this.version_str.exec(window.location.href);
            Object.seal(this);
        }
        generate() {
            //const parts =this.split_url(new URL(window.location.href));
            // セレクトボックスを作成して、hrefのバージョン情報より初期選択を行う。
            const select_box = HtmlUtils.create_selectBox(this.docs, this.version[1]);
            const nav = document.createElement("nav");
            nav.className = "version_switcher";
            //nav.appendChild(document.createTextNode("Java » "));
            nav.appendChild(select_box);
            //nav.appendChild(document.createTextNode("ドキュメント"));
            //nav.appendChild(document.createElement("hr"));
            
            let header = document.querySelector("ul.navList");
            if (header === null){
                // Java 9 以前
                document.body.prepend(nav);
            }else{
                header.after(nav);
            }
            //
            select_box.addEventListener('change', (e) => {
                this.on_switch(e);
            }, false);
            return this;
        }
        redirect_urls(original, new_version){
            /** regex test data.
                https://docs.oracle.com/javase/7/docs/api/java/util/ArrayList.html
                https://docs.oracle.com/javase/jp/7/api/java/util/ArrayList.html
                https://docs.oracle.com/javase/jp/8/docs/api/java/util/ArrayList.html
            */
            const original_parts = this.docs.get(this.version[1]);
            const new_parts = this.docs.get(new_version);

            var temp = this.version[0].split('/');
            temp[0] = new_version;
            const mySet = new Map();
            mySet.add(original.pathname.replace(this.version_str, temp.join('/')));


            console.log(mySet);

            if(new_parts.endsWith(original_parts.slice(-2))){
                return original.pathname.replace(this.version_str, temp.join('/'));
            }
            if(new_parts.endsWith('/1')){
                // 0→1
                temp[1] = 'docs';
            }else{
                 // 1→0 docsを削除
                temp.pop();
            }
            return original.pathname.replace(this.version_str, temp.join('/'));
        }
        to_redirect(new_url){
            (async() => {
                // リダイレクト先の存在チェック
                const response = await fetch(new_url);
                if(response.ok) {
                    window.location.href = response.url;
                }else{
                    console.error(response.status, response.url);
                }
            })();
        }
        on_switch(e) {
            const url = new URL(window.location.href);
            const new_version = e.target.selectedOptions[0].text;
            const new_url = new URL(this.redirect_urls(url, new_version), url.origin);

        }
    }
    window.addEventListener('DOMContentLoaded', (e) => {
        switcher = new Switcher().generate();
        window.switcher = switcher;
    }, false);
})();