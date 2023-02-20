const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lmouiy1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next){
    console.log('token inside verifyJWT', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const usersCollection = client.db('rnrKarate').collection('users');
        const studentsCollection = client.db('rnrKarate').collection('students');
        const announcementsCollection = client.db('rnrKarate').collection('announcements');
        const postsCollection = client.db('rnrKarate').collection('posts');

        // Note: Make sure you use verifyAdmin after verifyJWT
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await usersCollection.findOne(query);

            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden access'})
            }
            next();
        }

        app.get('/jwt', async(req, res) =>{
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '3h'})
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''})
        });

        app.get('/users', async(req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/student/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isStudent: user?.role === 'student'});
        })

        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })

        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.put('/users/student/:id', verifyJWT, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    role: 'student'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });
        app.put('/users/student/:id', verifyJWT, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    role: 'student'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.patch('/users/student/:id', verifyJWT, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    role: 'user'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

        app.get('/students', verifyJWT, verifyAdmin, async(req, res) => {
            const query = {};
            const students = await studentsCollection.find(query).toArray();
            res.send(students);
        })

        app.post('/students', verifyJWT, verifyAdmin, async(req, res) => {
            const student = req.body;
            const result = await studentsCollection.insertOne(student);
            res.send(result);
        });

        app.delete('/students/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter ={_id: new ObjectId(id)};
            const result = await studentsCollection.deleteOne(filter);
            res.send(result);
        });

        app.get('/announcements', async (req, res) => {
            const query = {};
            const cursor = announcementsCollection.find(query);
            const announcements = await cursor.toArray();
            res.send(announcements.reverse());
        })

        app.post('/announcements', async(req, res) => {
            const announcement = req.body;
            const result = await announcementsCollection.insertOne(announcement);
            res.send(result);
        });

        app.get('/posts', async (req, res) => {
            const query = {};
            const cursor = postsCollection.find(query);
            const posts = await cursor.toArray();
            res.send(posts.reverse());
        })

        app.post('/posts', async(req, res) => {
            const post = req.body;
            const result = await postsCollection.insertOne(post);
            res.send(result);
        })

            
    }
    finally{

    }
}
run().catch(console.log)

app.get('/', async(req, res) => {
    res.send('rnr karate server is running...');
})

app.listen(port, () => console.log(`RNR Karate running on ${port}`));