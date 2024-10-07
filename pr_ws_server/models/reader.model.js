const mongoose = require('mongoose')

const ReaderSchema = new mongoose.Schema({
    serialNumber: {
        type: String,
        required: [true, 'Serial Number is required'],
        unique: [true, 'This Serial Number is taken'] // Ensure that the Serial Number is unique.
    },
    ipAddress: {
        type: String,
        required: [true, 'ip address is required'],
        unique: [true, 'This ip address is not available'] // Ensure that the ip Address is unique.
    },
    status: {
        type: String, defaut: 'offline' // Add status field
    },
    hostName: {
        type: String
    },
    userName: {
        type: String
    },
    password: {
        type: String
    },
    apiToken: {
        type: String
    }
}, 
    {timestamps: true}
)

const Reader = mongoose.model('Reader', ReaderSchema)

module.exports = Reader