const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'});
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
        if(err){
            return res.status(403).send({message: 'Forbidden Access'});
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
    })
    next();
}

// connect database 


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4ukf8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();
        const productCollection = client.db('groceryProduct').collection('product');
        const orderCollection = client.db('groceryProduct').collection('order');

        // access token api
        app.post('/login', async (req, res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({accessToken});
        })



        // get product in the database
        app.get('/product', async (req, res)=>{
            const query = {};
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // get single product in the database
        app.get('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const product = await productCollection.findOne(query);
            res.send(product);
        });

        // insert data client side and store data in database
        app.post('/product', async (req, res)=>{
            const newProduct = req.body;
            const result = await productCollection.insertOne(newProduct);
            res.send(result);
        });
        // update quantity increasing of reStock
        app.put('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const reStockQuantity = req.body;
            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const addQuantity = {
                $set: reStockQuantity
            }
            const result = await productCollection.updateOne(filter, addQuantity, options);
            res.send(result);
        })



        // update quantity deacreasing
        app.put('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const updateQuantity = req.body;
            const filter = {_id: ObjectId(id)};
            const options = { upsert: true };
            const decreaseDoc = {
                $set: updateQuantity
            }
            const result = await productCollection.updateOne(filter, decreaseDoc, options);
            res.send(result);

        })

        // delete api
        app.delete('/product/:id', async (req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });
        
        // Order collection API by using email query search
        // app.get('/order',  async(req, res)=>{
        //         const email = req.query.email;
        //         const query = {email: email};
        //         const cursor = orderCollection.find(query);
        //         const orders = await cursor.toArray();
        //         res.send(orders);    
        // })

        app.get('/order', verifyJWT, async(req, res)=>{
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if(email === decodedEmail){
                const query = {email: email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else{
                res.status(403).send({message: 'Forbidden Access'})
            }
            
            
        })

        // order delete api
        app.delete('/order/:id', async (req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const cursor = orderCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // get single order api
        app.get('/order/:id', async (req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const cursor = orderCollection.find(query);
            const product = await cursor.toArray();
            res.send(product)
        })


        // order product insert api
        app.post('/order', async(req, res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            console.log(result);
            res.send(result);
        })


    }
    finally{
        //write something new
    }
}
run().catch(console.dir);





app.get('/', (req, res)=>{
    res.send('Wellcome to the Grocery Farm warehouse');
});

app.listen(port, ()=>{
    console.log('Listening to the port:', port);
});

