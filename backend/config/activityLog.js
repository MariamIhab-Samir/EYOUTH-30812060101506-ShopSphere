const mongoose = require('mongoose');

const activityLogModal= new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true
  },
  details: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: '30d'
  }
});

module.exports = mongoose.model('ActivityLog', activityLogModal);