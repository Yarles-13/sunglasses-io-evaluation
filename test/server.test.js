const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const server = require('../app/server'); 

const should = chai.should();
chai.use(chaiHttp);

const JWTKey = '12345'; 
let token;

before(() => {
  token = jwt.sign({ username: 'testuser' }, JWTKey, { expiresIn: '1h' });
});

describe('API Tests', () => {
  describe('GET /api/brands', () => {
    it('should fetch all brands', (done) => {
      chai
        .request(server)
        .get('/api/brands')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.forEach((brand) => {
            brand.should.be.a('object');
            brand.should.have.property('id');
            brand.should.have.property('name');
          });
          done();
        });
    });
  });

  describe('GET /api/brands/:id/products', () => {
    it('should fetch products for a specific brand', (done) => {
      chai
        .request(server)
        .get('/api/brands/1/products') 
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.forEach((product) => {
            product.should.have.property('id');
            product.should.have.property('name');
            product.should.have.property('description');
            product.should.have.property('price');
          });
          done();
        });
    });

    it('should return 404 for an invalid brand ID', (done) => {
      chai
        .request(server)
        .get('/api/brands/invalid-id/products')
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property('error').eql('Brand not found');
          done();
        });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should fetch product details', (done) => {
      chai
        .request(server)
        .get('/api/products/1')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('id');
          res.body.should.have.property('name');
          res.body.should.have.property('description');
          res.body.should.have.property('price');
          done();
        });
    });

    it('should return 404 for an invalid product ID', (done) => {
      chai
        .request(server)
        .get('/api/products/invalid-id')
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property('error').eql('Product not found');
          done();
        });
    });
  });

 
  describe('Cart Endpoints', () => {
    it('should return the cart for the user', (done) => {
      chai
        .request(server)
        .get('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          done();
        });
    });

    it('should add a product to the cart', (done) => {
      chai
        .request(server)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: '1' }) 
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property('message').eql('Product added to cart');
          res.body.cart.should.be.a('array');
          done();
        });
    });


    it('should return 401 when accessing cart without a token', (done) => {
      chai
        .request(server)
        .get('/api/cart')
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.have.property('error').eql('Missing Authorization header');
          done();
        });
    });

    it('should return 403 when accessing cart with an invalid token', (done) => {
      chai
        .request(server)
        .get('/api/cart')
        .set('Authorization', 'Bearer invalidToken')
        .end((err, res) => {
          res.should.have.status(403);
          res.body.should.have.property('error').eql('Invalid or expired token');
          done();
        });
    });

    it('should return 404 when adding a non-existent product to cart', (done) => {
      chai
        .request(server)
        .post('/api/cart')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 'nonexistent' })
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property('error').eql('Product not found');
          done();
        });
    });
  });

  
  describe('Unknown Routes', () => {
    it('should return 404 for an unknown route', (done) => {
      chai
        .request(server)
        .get('/api/unknown-route')
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property('error').eql('Route not found');
          done();
        });
    });
  });
});
