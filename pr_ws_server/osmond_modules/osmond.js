const { WebSocket } = require('ws');
const { XMLHttpRequest } = require('xmlhttprequest');

class OsmondAuth {
    hostname = "";
    username = "";
    password = "";

    constructor(hostname, username, password) {
        this.hostname = hostname;
        this.username = username;
        this.password = password;
    }

    async httpLogin() {
        const loginUrl = this.hostname + "/netapi/login";
        const request = new XMLHttpRequest();
        request.open("POST", loginUrl, false);
        request.setRequestHeader("Username", this.username);
        request.setRequestHeader("Password", this.password);
        request.timeout = 5000;
        request.send();
        let api_token = "";
        try {
            if (typeof request.responseText !== "undefined") {
                api_token = JSON.parse(request.responseText).api_token;
            }
        } catch (e) {
            console.error(e);
        }
        return api_token;
    }

    async wsLogin(api_token) {
        let deviceChannel = null;
        if (this.hostname.startsWith("https://")) {
            const wsAuthenticateUrl =
                "wss://" +
                this.hostname.substring("https://".length) +
                "/netapi/control";
            deviceChannel = new WebSocket(wsAuthenticateUrl, {
                headers: {
                    Token: api_token,
                },
            });
        } else {
            const wsAuthenticateUrl =
                "ws://" + this.hostname.substring("http://".length) + "/netapi/control";
            deviceChannel = new WebSocket(wsAuthenticateUrl, {
                headers: {
                    Token: api_token,
                },
            });
        }
        return {
            channel: deviceChannel,
            token: api_token,
        };
    }

    async httpLogout(api_token) {
        const logoutUrl = this.hostname + "/netapi/logout";
        const request = new XMLHttpRequest();
        request.open("GET", logoutUrl, false);
        request.timeout = 5000;
        request.setRequestHeader("Token", api_token);
        request.send();
    }
}

module.exports = OsmondAuth;
