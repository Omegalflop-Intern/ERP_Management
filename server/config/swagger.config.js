import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Brothers Mobile Shop ERP API',
      version: '1.0.0',
      description: 'REST API for Mobile Shop Management System',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            fullName: { type: 'string' },
            roleName: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            sku: { type: 'string' },
            barcode: { type: 'string' },
            category: { type: 'string' },
            brand: { type: 'string' },
            model: { type: 'string' },
            costPrice: { type: 'number' },
            sellingPrice: { type: 'number' },
            vatRate: { type: 'number' },
            stockQuantity: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        Sale: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            invoiceNumber: { type: 'string' },
            customerName: { type: 'string' },
            customerPhone: { type: 'string' },
            subTotal: { type: 'number' },
            discount: { type: 'number' },
            tax: { type: 'number' },
            netTotal: { type: 'number' },
            paymentBreakdown: { type: 'object' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./modules/**/*.routes.js', './server.js'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { background-color: #991b1b; }',
    customSiteTitle: 'Brothers Mobile Shop ERP API Docs',
    customfavIcon: '/favicon.ico',
  }));
};

export default specs;
