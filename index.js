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
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email }
        //     const user = await usersCollection.findOne(query);
        //     res.send({ isAdmin: user?.role === 'admin' });
        // })
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

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