import { gql } from 'apollo-server'

// Defines datatypes and queries that can be made
// changes defined by mutations
export default gql`
  enum YesNo {
    YES
    NO
  }

  type RealName {
    firstname: String
    lastname: String
  }

  type User {
    username: String!
    realname: RealName
    email: String!
    password: String!
    links: [Link!]!
    id: ID!
    created: String!
    latestChange: String!
    permanent: Boolean
    hidden: Boolean
  }

  type Token {
    value: String!
  }

  type Link {
    description: String!
    url: String!
    user: User!
    latestChange: String!
    genres: [String!]!
    id: ID!
  }

  type Query {
    hello(name: String!): String!
    userCount: Int!
    allUsers(email: YesNo): [User!]!
    findUser(username: String!): User
    linkCount: Int!
    allLinks(
      user: String
      genres: String
      url: String
      description: String
    ): [Link!]!
    loggedInUser: User
  }

  type Mutation {
    addUser(
      username: String!
      firstname: String
      lastname: String
      email: String!
      password: String!
      permanent: Boolean
      hidden: Boolean
    ): User
    editEmail(username: String!, email: String!): User
    editUser(
      username: String!
      firstname: String
      lastname: String
      email: String!
      permanent: Boolean
      hidden: Boolean
    ): User
    changePassword(
      username: String!
      oldpassword: String!
      newpassword: String!
    ): User
    deleteUser(username: String!): User
    login(username: String!, password: String!): Token
    addLink(description: String!, url: String!, genres: [String]): Link
    deleteLink(url: String!): Link
    addToOwnLinks(url: String!): Link
  }

  type Subscription {
    userAdded: User!
  }
`
