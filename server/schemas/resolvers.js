const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('savedBooks');

                return userData;
            }
            throw new AuthenticationError('Not logged in');
        }
    },
    Mutation: {
        // Login
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },
        // New user
        addUser: async (parent, args) => {
            const user = await User.create(args);
            if (!user) {
                return res.status(400).json({ message: 'Something is wrong!' });
            }
            const token = signToken(user);

            return { token, user };
        },
        // save a book to favorite list
        saveBook: async(parent, args, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: args}},
                    { new: true, runValidators: true }
                );
                return updatedUser;
            }
        },
        // remove book from list
        removeBook: async(parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: bookId }}},
                    { new: true }
                );
                return updatedUser;
            }
        }
    }
}

module.exports = resolvers;