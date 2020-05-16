'use strict';
module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    text: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    }

  }, {});
  ChatMessage.associate = function(models) {
    const User = models['User'];
    User.hasMany(ChatMessage, {onDelete: 'CASCADE'});
    ChatMessage.belongsTo(User, { as: 'author', foreignKey: {name: 'authorId', allowNull: false}});

    const Chatroom = models['Chatroom'];
    Chatroom.hasMany(ChatMessage, {onDelete: 'CASCADE', foreignKey: {allowNull: false}});
    ChatMessage.belongsTo(Chatroom);

  };
  return ChatMessage;
};