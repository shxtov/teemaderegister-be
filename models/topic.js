const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleEng: { type: String, required: true },

    description: { type: String },

    curriculums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curriculum',
        required: true
      }
    ],

    supervisors: [
      {
        type: {
          type: String,
          enum: ['Main', 'Co'],
          required: true
        },
        supervisor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        }
      }
    ],

    author: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String }
    },

    registered: { type: Date },
    defended: { type: Date },
    specialConditions: { type: String },

    file: { type: String },
    attachments: [{ type: String }],

    accepted: { type: Date },
    archived: { type: Date }
  },
  {
    timestamps: true
  }
)

const Topic = mongoose.model('Topic', topicSchema)

module.exports = Topic
