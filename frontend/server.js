export class Server {
    constructor(server_name, address, client_port, url) {
        this.name = server_name;
        this.address = address;
        this.client_port = client_port;
        this.url = url;
    }
    getURL(path)
    {
        return this.url + path;
    }
}