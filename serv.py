import http.server, ssl
import os
import socketserver

server_address = ('0.0.0.0', 443)

#web_dir = os.path.join(os.path.dirname(__file__), 'web')
#os.chdir(web_dir)
Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(server_address, Handler)

httpd.socket = ssl.wrap_socket(httpd.socket,
                               server_side=True,
                               certfile='cert.pem',
                               ssl_version=ssl.PROTOCOL_TLS_SERVER)
httpd.serve_forever()