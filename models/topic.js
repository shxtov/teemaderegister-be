const mongoose = require('mongoose')

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    //TODO replace with translated title?
    titleEng: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // created from title

    description: { type: String },

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

    curriculums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curriculum',
        required: true
      }
    ],

    types: [
      {
        type: String,
        enum: ['SE', 'BA', 'MA', 'PHD'],
        required: true
      }
    ],

    author: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String }
    },

    specialConditions: { type: String },

    file: { type: String },
    attachments: [{ type: String }],

    accepted: { type: Date },
    registered: { type: Date },
    defended: { type: Date },
    archived: { type: Date }
  },
  {
    timestamps: true
  }
)

const Topic = mongoose.model('Topic', topicSchema)

module.exports = Topic
