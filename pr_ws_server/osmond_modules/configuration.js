const fs = require('fs');

class Configuration {
    readers;

    constructor(filename) {
        let readersRawData = fs.readFileSync(filename, "utf8");
        this.readers = JSON.parse(readersRawData);
    }

    load(deviceManager) {
        for (const reader in this.readers) {
            deviceManager.deviceChannels.set(
                {
                    name: reader,
                    hostname: this.readers[reader].hostname,
                    username: this.readers[reader].username,
                    password: this.readers[reader].password,
                },
                null
            );
        }
    }
}

module.exports = Configuration;
