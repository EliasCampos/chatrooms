'use strict';
const bcrypt = require('bcryptjs');

const SALT_ROUNDS =10;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },

    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },

  }, {});
  User.associate = function(models) {
    // associations can be defined here
  };

  User.prototype.setPassword = function(password) {
    return bcrypt.hash(password, SALT_ROUNDS)
        .then((passwordHash) => {this.password_hash = passwordHash});
  };

  User.prototype.checkPassword = function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  return User;
};