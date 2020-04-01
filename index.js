import middleware from './utils/middleware'
import { createServer } from 'http'
import express from 'express'
import { verify } from 'jsonwebtoken'
import { ApolloServer } from 'apollo-server-express'
import cors from 'cors'
import { set, connect } from 'mongoose'
import { findById } from './models/user'
import Cookies from 'cookies'

set('useFindAndModify', false)
set('useCreateIndex', true)
set('useUnifiedTopology', true)

connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(() => {})
  .catch(error => {
    console.log('error connection to MongoDB:', error.message)
  })

const app = express()
app.set('trust proxy', 1)

const addUser = async (req, res, next) => {
  const auth = req ? req.headers.authorization : null
  try {
    if (auth && auth.toLowerCase().startsWith('bearer')) {
      const decodedToken = verify(auth.substring(7), process.env.JWT_SECRET)
      req.user = decodedToken
    }
  } catch (err) {
    console.log(err)
  }
  req.next()
}

const addUserFromCookie = async (req, res, next) => {
  const cookie = req.headers.cookie
  try {
    if (cookie && cookie.toLowerCase().startsWith('cppr-app')) {
      const decodedToken = verify(cookie.substring(17), process.env.JWT_SECRET)

      req.cookieuser = decodedToken
    }
  } catch (err) {
    console.log(err)
  }
  req.next()
}

const allowedOrigins = [
  'http://localhost:3000',
  'https://copperi.com',
  'https://copperi-demo.herokuapp.com',
]
var corsOptions = {
  origin: function(origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}

app.use(cors(corsOptions))

app.use(addUser)
app.use((req, res, next) => {
  const options = { keys: [process.env.COOKIE_SECRET_KEY] }
  req.cookies = new Cookies(req, res, options)
  next()
})
app.use(addUserFromCookie)
app.use(middleware.requestLogger)

app.get('/credentialCookie', async (req, res, next) => {
  const cookie = req.headers.cookie
  try {
    if (cookie) {
    }
  } catch (err) {
    console.log(err)
  }

  res.send('OK').end()
})

app.post('/credentialCookie', (req, res) => {
  let currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + req.body.expiryInDays)
  req.cookies.set(process.env.COOKIE_KEY, req.body.token, {
    signed: true,
    expires: currentDate,
  })
  res.send('OK').end()
})

app.delete('/credentialCookie', (req, res) => {
  req.cookies.set(process.env.COOKIE_KEY)
  res.send('OK').end()
})

const server = new ApolloServer({
  modules: [require('./modules')],
  context: async ({ req, connection }) => {
    if (connection) {
      return connection.context
    } else {
      const user = req ? req.user : null
      if (user) {
        const currentUser = await findById(user.id).populate('friends')
        return { currentUser }
      }
      const cookieuser = req ? req.cookieuser : null
      if (cookieuser) {
        const currentUser = await findById(cookieuser.id).populate('friends')
        return { currentUser }
      }
    }
  },
})

server.applyMiddleware({
  app,
  path: '/',
  cors: false, // disables the apollo-server-express builtin cors definitions to allow the cors middleware use
})

const PORT = process.env.PORT || 4000

const httpServer = createServer(app)
server.installSubscriptionHandlers(httpServer)

httpServer.listen(PORT, () => {
  // console.log(`Server ready on port ${PORT}${server.graphqlPath}`)
  // console.log(
  //   `Subscriptions ready on port ws://${PORT}${server.subscriptionsPath}`
  // )
})
