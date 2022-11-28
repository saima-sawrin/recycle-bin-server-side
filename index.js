const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const jwt = require('jsonwebtoken');
require('dotenv').config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.9wy3smt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run(){
  try{
    const categoriesCollection = client.db('recycleBin').collection('categories');
    const productCollection = client.db('recycleBin').collection('resaleProducts');
    const usersCollection = client.db('recycleBin').collection('allUsers');
    const bookingsCollection = client.db('recycleBin').collection('booking');
    

    const verifyAdmin = async (req, res, next) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);

        if (user?.role !== 'admin') {
            return res.status(403).send({ message: 'forbidden access' })
        }
        next();
    }
    const verifyBuyer = async (req, res, next) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);

        if (user?.role !== 'buyer') {
            return res.status(403).send({ message: 'forbidden access' })
        }
        next();
    }
    const verifySeller = async (req, res, next) => {
        const decodedEmail = req.decoded.email;
        const query = { email: decodedEmail };
        const user = await usersCollection.findOne(query);

        if (user?.role !== 'seller') {
            return res.status(403).send({ message: 'forbidden access' })
        }
        next();
    }

    app.get('/categories', async(req,res)=>{
        const query = {}
        const cursor = categoriesCollection.find(query);
        const categories = await cursor.toArray();
        res.send(categories);
    })
    app.get('/categories/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const category = await categoriesCollection.findOne(query);
        res.send(category);
        });
        app.get('/products', async(req,res)=>{
            const query = {}
            const cursor = productCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        })
        app.post('/products', async(req,res)=>{
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
    
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                   role: 'admin'
                    
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' },

            );
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send(
            {isBuyer: user?.role  === 'buyer'},
            );
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send(
            
            {isSeller: user?.role === 'seller'});
        })

       

        app.get('/bookings',  async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if( email !== decodedEmail){
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const bookings= await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })

        
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                bookingProduct: booking.product,
                email: booking.email,
               
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking. bookingProduct}`
                return res.send({ acknowledged: false, message })
            }


     
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })
        app.post('/users', verifyJWT, verifyAdmin, async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.delete('/users/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        

  }
  finally{

  }
}
run().catch(e=> console.log(e))



app.get('/', async (req, res) => {
    res.send('Recycle Bin server is running');
})

app.listen(port, () => {console.log(`Recycle Bin running on ${port}`);
})