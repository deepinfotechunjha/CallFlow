require('dotenv').config();

module.exports = {
  schema: 'prisma/schema.prisma',
  datasource: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
