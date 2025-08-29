const User = require('./User');
const Gig = require('./GIG');
const Post = require('./Post');

// Define Relations
User.hasMany(Gig, { foreignKey: 'postedById', as: 'gigs' });
Gig.belongsTo(User, { foreignKey: 'postedById', as: 'poster' });

User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

module.exports = { User, GIG, Post };
