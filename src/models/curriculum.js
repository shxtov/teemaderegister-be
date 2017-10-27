const mongoose = require('mongoose')

const curriculumSchema = new mongoose.Schema(
  {
    names: {
      et: { type: String, required: true },
      en: { type: String, required: true }
    },
    slugs: {
      et: { type: String, required: true, unique: true },
      en: { type: String, required: true, unique: true }
    },
    abbreviation: { type: String, required: true, unique: true },
    faculty: { type: String, required: true },
    languages: [
      {
        type: String,
        enum: ['ET', 'EN'],
        required: true
      }
    ],
    representative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['BA', 'MA', 'PHD'],
      required: true
    }
  },
  {
    timestamps: true
  }
)

const Curriculum = mongoose.model('Curriculum', curriculumSchema)

module.exports = Curriculum
