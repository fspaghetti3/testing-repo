// root server.js 
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const routes = require('./routes');
const dashBoardRoutes =require('./routes/dashboard-routes')
const postRoutes = require('./routes/post-routes')
const sequelize = require('./config/connection');
const path = require('path');
const methodOverride = require('method-override')
const hbs = exphbs.create({
    helpers: {
        isAuthor: function(postUserId, sessionUserId) {
                return postUserId === sessionUserId
            }
        }
});

const mysql = require('mysql2')
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'social_db',
    password: 'fred1231'
});

connection.connect();

process.on('exit', () => {
    connection.end();
  });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'));

app.use(methodOverride('_method'));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'super secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 7200000
    }
}));

app.use((req, res, next) => {
    try {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    } catch (err) {
        console.error('An error occured:', err)
    }
    next();
});

app.post('/edit/:id', (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;

    const query = 'UPDATE post SET title = ?, content = ? WHERE id = ?';
    connection.query(query, [title, content, postId], (error, results) => {
        if (error) {
            console.error('Error updating post:', error);
            res.status(500).send('Error updating post');
        } else {
            res.redirect('/posts/' + postId);
        }
    });
});



app.use(routes);
app.use('/', dashBoardRoutes)
app.use('/posts', postRoutes);

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.get('/dashboard', (req, res) => {
    res.render('dashboard')
})

app.get('/posts/create', (req, res) => {
    res.render('create-post')
})

app.get('/posts/latest', (req, res) => {
    res.render('view-posts')
})


sequelize.sync({ force: false }).then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});