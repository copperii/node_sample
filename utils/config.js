const config = require('dotenv').config()

let PORT = process.env.PORT
let SERVER_PORT = process.env.SERVER_PORT
let MONGODB_URI = process.env.MONGODB_URI
let JWT_SECRET = process.env.JWT_SECRET
let CLIENT_URL = process.env.CLIENT_URL
let COOKIE_SECRET_KEY = process.env.COOKIE_SECRET_KEY
let COOKIE_KEY = process.env.COOKIE_KEY

if (process.env.NODE_ENV === 'test') {
  MONGODB_URI = process.env.TEST_MONGODB_URI
}

export default {
  MONGODB_URI,
  PORT,
  JWT_SECRET,
  SERVER_PORT,
  CLIENT_URL,
  COOKIE_SECRET_KEY,
  COOKIE_KEY,
}
