// config/elasticsearch.js
const { Client } = require('@elastic/elasticsearch');

// Connect securely to your local Elasticsearch (with username and password)
const esClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'oemh+blFXDyNfd_*x=or' // Your newly setup password
  },
  tls: {
    rejectUnauthorized: false // Required for default self-signed local certificates on Windows
  }
});

// Test connection
esClient.info()
  .then(response => console.log('✅ Successfully connected to Elasticsearch!'))
  .catch(error => console.error('❌ Failed to connect to Elasticsearch:', error));

module.exports = esClient;
