const express = require('express');
const cors = require('cors');
const knex = require('knex')

const db = knex({
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      user: 'postgres',
      password: 'test',
      database: 'test'
    },
});

const app = express();


app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json("this is working");
})

app.post('/signin', (req, res) => {

    if (!req.body.email || !req.body.password) {
        return res.status(400).json('improper inputs');
    }
   
    db.select('email', 'password').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        if (req.body.password === data[0].password) {
            return db.select("*").from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            }).catch(error => res.status(400).json('unable to get a user'))
        } else {
            res.status(400).json('wrong credentials');
        }
    })
    .catch(error => res.status(400).json('bad credentials'))
   
})

app.post('/register', (req, res) => {
    
    if (!req.body.name || !req.body.email || !req.body.password) {
        return res.status(400).json('improper inputs');
    }

    db.transaction(trx => {
        trx.insert({
            password: req.body.password,
            email: req.body.email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0].email,
                name: req.body.name,
                joined: new Date() 
            }).then(user => {
                res.json(user[0]);
            })
        }).then(trx.commit).catch(trx.rollback)
    }).catch(error => res.status(400).json(error))
    
})

app.get('/profile/:id', (req, res) => {

})

app.put('/image', (req, res) => {
    const { id, objectTotal } = req.body;
    db('users').where('id', '=', id)
    .increment({objects: objectTotal,
        images: 1})
    .returning(['objects', 'images'])
    .then(result => {
        res.json({objects: result[0].objects,
        images: result[0].images})
    })
    .catch(error => res.status(400).json('could not get data'));
    
})

app.listen(3001, () => {
    console.log("app is listening");
})