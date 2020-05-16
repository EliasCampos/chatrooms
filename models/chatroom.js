'use strict';
const bcrypt = require('bcryptjs');

const SALT_ROUNDS =10;

module.exports = (sequelize, DataTypes) => {
  const Chatroom = sequelize.define('Chatroom', {
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },

    name: {
    type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    token: {
      type: DataTypes.STRING,
      allowNull: true,
    },

  }, {});
  Chatroom.associate = function(models) {
    const User = models.User;
    User.hasMany(Chatroom, {onDelete: 'CASCADE', foreignKey: {allowNull: false}});
    Chatroom.belongsTo(User);
  };

  Chatroom.prototype.setPassword = function(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
        .then((passwordHash) => {this.token = passwordHash});
  };

  Chatroom.prototype.checkPassword = function(password) {
    if (this.token === null) return true;
    return bcrypt.compare(password, this.token);
  };

  return Chatroom;
};