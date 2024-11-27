const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./swagger.yaml'); // Replace './swagger.yaml' with the path to your Swagger file

const app = express();
const JWTKey = '12345'; 

app.use(bodyParser.json());

const users = require('../initial-data/users.json');
const brands = require('../initial-data/brands.json');
const products = require('../initial-data/products.json');

const carts = {}; 

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWTKey, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user; 
      next();
    });
  } else {
    res.status(401).json({ error: 'Missing Authorization header' });
  }
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.login.username === username && u.login.password === password
  );

  if (user) {
    const token = jwt.sign({ username }, JWTKey, { expiresIn: '1h' });
    res.status(200).json({ token });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

app.get('/api/brands', (req, res) => {
  res.status(200).json(brands);
});

app.get('/api/brands/:id/products', (req, res) => {
  const brandId = req.params.id;

  const brandExists = brands.some((brand) => brand.id === brandId);
  if (!brandExists) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  const brandProducts = products.filter((product) => product.categoryId === brandId);
  if (brandProducts.length > 0) {
    res.status(200).json(brandProducts);
  } else {
    res.status(404).json({ error: 'No products found for this brand' });
  }
});

app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const product = products.find((item) => item.id === productId);

  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.get('/api/cart', authenticateJWT, (req, res) => {
  const username = req.user.username;
  const cart = carts[username] || [];
  res.status(200).json(cart);
});

app.post('/api/cart', authenticateJWT, (req, res) => {
  const username = req.user.username;
  const { productId } = req.body;

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (!carts[username]) {
    carts[username] = [];
  }
  carts[username].push(product);
  res.status(200).json({ message: 'Product added to cart', cart: carts[username] });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
