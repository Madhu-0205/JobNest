import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./User.js";

const Gig = sequelize.define("Gig", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  budget: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

// Association: each gig belongs to a user (postedBy)
Gig.belongsTo(User, { foreignKey: "postedBy" });
User.hasMany(Gig, { foreignKey: "postedBy" });

export default Gig;
