import { set, Schema, model } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

set('useFindAndModify', false)
set('useCreateIndex', true)

const userSchema = new Schema({
  username: {
    type: String,
    minlength: 6,
    unique: true,
    required: true,
  },
  firstname: String,
  lastname: String,
  email: String,
  passwordHash: {
    type: String,
    required: true,
  },
  links: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Link',
    },
  ],
  created: { type: Date, default: Date.now },
  latestChange: { type: Date, default: Date.now },
  permanent: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  },
})

userSchema.plugin(uniqueValidator)

const User = model('User', userSchema)

export default User
