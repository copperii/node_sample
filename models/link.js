import { Schema, model } from 'mongoose'

const linkSchema = new Schema({
  description: {
    type: String,
    required: true,
    minlength: 5,
  },
  url: {
    type: String,
    required: true,
    minlength: 5,
  },
  latestChange: { type: Date, default: Date.now },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  genres: [{ type: String }],
})

linkSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  },
})

export default model('Link', linkSchema)
