const config = require('../utils/config').default
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { UserInputError, AuthenticationError } = require('apollo-server')
const User = require('../models/user')
const Link = require('../models/link')
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

module.exports = {
  Query: {
    hello: (_, { name }) => `Hello ${name}`,
    userCount: () => User.collection.countDocuments({ hidden: false }),
    allUsers: (root, args) => {
      if (!args.email) {
        return User.find({ hidden: false })
      }
      return User.find({
        email: { $exists: args.email === 'YES' },
        hidden: false,
      })
    },
    findUser: (root, args) => User.findOne({ username: args.username }),
    linkCount: () => Link.collection.countDocuments(),
    allLinks: async (root, args) => {
      const query = {}
      if (args.genre) {
        query.genres = {
          $in: [args.genre],
        }
      }
      if (args.user) {
        query.user = args.user
      }
      if (args.url) {
        query.url = args.url
      }
      if (args.description) {
        query.description = args.description
      }
      return await Link.find(query).populate('user')
    },
    loggedInUser: (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        return null
        throw new AuthenticationError('Not Authenticated as loggedInUser')
      }
      return currentUser
    },
  },
  User: {
    realname: root => {
      return {
        firstname: root.firstname,
        lastname: root.lastname,
      }
    },
  },
  Mutation: {
    addUser: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated for addUser')
      }

      const alreadyUser = await User.findOne({ username: args.username })
      if (alreadyUser) {
        throw new UserInputError('user already exists')
      }

      if (!args.password) {
        throw new UserInputError('missing password')
      }

      const saltRounds = 10
      const passwordHash = await bcrypt.hash(args.password, saltRounds)
      latestChange = new Date()
      created = new Date()
      const link = new Link({ ...args, latestChange })

      const user = new User({
        ...args,
        passwordHash: passwordHash,
        latestChange,
        created,
      })

      try {
        await user.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      pubsub.publish('USER_ADDED', { userAdded: user })

      return user
    },
    editUser: async (root, args, context) => {
      const currentUser = context.currentUser
      if (currentUser.username === 'theadmin') {
        throw new AuthenticationError('you are ok ...')
      } else if (!(currentUser.username === args.username)) {
        throw new AuthenticationError('You are not allowed to edit this user')
      }

      if (!currentUser) {
        throw new AuthenticationError('not authenticated for editUser')
      }

      const user = await User.findOne({ username: args.username })
      if (!user) {
        throw new UserInputError('user does not exist')
      }
      user.firstname = args.firstname
      user.lastname = args.lastname
      user.email = args.email
      user.latestChange = new Date()

      try {
        await user.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return user
    },
    editEmail: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated for editEmail')
      }
      const user = await User.findOne({ username: args.username })
      if (!user) {
        throw new UserInputError('user does not exist')
      }
      user.email = args.email

      try {
        await user.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return user
    },
    changePassword: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated for changePassword')
      }

      const user = await User.findOne({ username: args.username })
      if (!user) {
        throw new UserInputError('user does not exist')
      }
      if (!args.oldpassword || !args.newpassword) {
        throw new UserInputError('missing password')
      }

      const passwordCorrect =
        user === null
          ? false
          : await bcrypt.compare(args.oldpassword, user.passwordHash)

      if (!passwordCorrect) {
        throw new UserInputError('old password is invalid')
      }

      const saltRounds = 10
      const passwordHash = await bcrypt.hash(args.newpassword, saltRounds)
      user.passwordHash = passwordHash

      try {
        await user.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return user
    },
    deleteUser: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated for deleteUser')
      }

      try {
        await User.findOneAndDelete({ username: args.username })
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return null
    },
    login: async (root, args, context) => {
      const user = await User.findOne({ username: args.username })

      const passwordCorrect =
        user === null
          ? false
          : await bcrypt.compare(args.password, user.passwordHash)

      if (!(user && passwordCorrect)) {
        throw new UserInputError(
          'Login failed, username or password is invalid'
        )
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return {
        value: jwt.sign(userForToken, config.JWT_SECRET, { expiresIn: '1h' }),
      }
    },
    addLink: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated to addLink')
      }

      if (!args.url) {
        throw new UserInputError('missing url')
      }

      latestChange = new Date()

      const link = new Link({ ...args, latestChange, user: currentUser })

      try {
        await link.save()
        currentUser.links = currentUser.links.concat(link)
        await currentUser.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return link
    },
    deleteLink: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated to delete a link')
      }

      try {
        await Link.findOneAndDelete({ url: args.url })
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return null
    },
    addToOwnLinks: async (root, args, { currentUser }) => {
      //const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError('not authenticated for addToOwnLinks')
      }

      if (!args.url) {
        throw new UserInputError('missing url')
      }

      const notAlreadyOnList = link =>
        !currentUser.links.map(l => l.url).includes(link.url)

      const link = await Link.findOne({ url: args.url })

      try {
        if (notAlreadyOnList(link)) {
          currentUser.links = currentUser.links.concat(link)
          await currentUser.save()
        }
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return currentUser
    },
  },
  Subscription: {
    userAdded: {
      subscribe: () => pubsub.asyncIterator(['USER_ADDED']),
    },
  },
}
