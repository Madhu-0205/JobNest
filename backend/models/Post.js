import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./User.js";

const Post = sequelize.define("Post", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // other fields if needed like tags, category, etc.
});

// Associate post to user (owner)
Post.belongsTo(User, { foreignKey: "postedBy" });
User.hasMany(Post, { foreignKey: "postedBy" });

export default Post;
