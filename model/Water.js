const mongoose = require('mongoose');

const waterUsageSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    value: String
});

const WaterUsage = mongoose.model('WaterUsage', waterUsageSchema);

module.exports = WaterUsage;


