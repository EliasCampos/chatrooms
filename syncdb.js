const { sequelize } = require('./models');

console.log('Synchronizing models..');
sequelize.sync({ alter: true }).then(() => {
   console.log('DB Synchronized.');
});
