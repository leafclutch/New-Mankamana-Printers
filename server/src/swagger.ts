const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'New Mankamana Printers API',
    description: ' Pricing & Ordering  API Documentation',
  },
  host: 'localhost:8005',
  basePath: '/api/v1',
  schemes: ['http'],
  securityDefinitions: {
    apiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Bearer <token>'
    }
  }
};

const path = require('path');
const outputFile = path.resolve(__dirname, '../swagger-output.json');
const endpointsFiles = ['./src/index.ts'];



swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger documentation generated successfully');
});
