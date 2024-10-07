class DeviceManager {
    deviceChannels = new Map();

    constructor() { }

    getDeviceNames() {
        let deviceNames = new Array();
        for (const key of this.deviceChannels.keys()) {
            deviceNames.push(key.name);
        }
        return deviceNames;
    }

    getCommunicationChannel(deviceName) {
        let deviceChannel = null;
        for (const [key, value] of this.deviceChannels) {
            if (key.name === deviceName && value != null) {
                deviceChannel = value;
                break;
            }
        }
        return deviceChannel;
    }

    getAuthenticationParams(deviceName) {
        let authParams = null;
        for (const key of this.deviceChannels.keys()) {
            if (key.name === deviceName) {
                authParams = key;
                break;
            }
        }
        return authParams;
    }

    setCommunicationChannel(deviceName, channel) {
        for (const key of this.deviceChannels.keys()) {
            if (key.name === deviceName) {
                this.deviceChannels.set(key, channel);
                break;
            }
        }
    }
}

module.exports = DeviceManager;
