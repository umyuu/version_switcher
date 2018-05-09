# -*- coding: utf8 -*-
from os import chdir
import glob
from argparse import ArgumentParser
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from ipaddress import ip_address
from pathlib import Path
from html import escape

BASE_DIR = Path(__file__).parent


class MyHandler(SimpleHTTPRequestHandler):
    """
        MyHandler
    """
    def do_GET(self):
        req_ip = ip_address(self.client_address[0])
        # IPアドレスによる簡易的なアクセス制限
        # ループバック,ローカルアドレス以外はステータスコード:403を返す
        is_accepted = any([req_ip.is_loopback, req_ip.is_private])
        if not is_accepted:
            self.send_response(403)
            self.end_headers()
            return
        if self.path != "/":
            super().do_GET()
            return

        body = f"time:{escape(self.date_time_string())}"
        for item in map(escape, glob.glob('**/*.html', recursive=True)):
            body += f"<li><a href='{item}' target='_top' rel='noopener'>{item}</a></li>"

        self.send_response(200)
        self.end_headers()
        self.wfile.write(f"<html><head></head><body>{body}</body></html>".encode('utf-8'))
        self.wfile.write(b'\n')



class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    """
        ThreadingHTTPServer
    """
    daemon_threads = True


def main() ->None:
    """
        main
    """
    parser = ArgumentParser()
    parser.add_argument('--port', '-p', type=int, default=8000, help='Port number')
    args = parser.parse_args()
    # SimpleHTTPRequestHandlerが現在のディレクトリを元にマッピングするため、作業ディレクトリを変更する。
    chdir(BASE_DIR)
    with ThreadingHTTPServer(("", args.port), MyHandler) as httpd:
        print("serving at port:", args.port)
        httpd.serve_forever()


if __name__ == '__main__':
    main()
