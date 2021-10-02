'use strict';

// express is a nodejs web server
// https://www.npmjs.com/package/express
const express = require('express');

// converts content in the request into parameter req.body
// https://www.npmjs.com/package/body-parser
const bodyParser = require('body-parser');

// create the server
const app = express();

// the backend server will parse json, not a form request
app.use(bodyParser.json());

// Going to connect to MySQL database
const mysql = require('mysql');

const HOST = process.env.DBHOST ? process.env.DBHOST : "127.0.0.1";
const USER = process.env.DBUSER ? process.env.DBUSER : "root";
const PASSWORD = process.env.DBPASSWORD ? process.env.DBPASSWORD : "letmein!";
const DATABASE = process.env.DBDATABASE ? process.env.DBDATABASE : "events_db";

const connection = mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASSWORD,
    database: DATABASE
});

// mock events data - Once deployed the data will come from database
const mockEvents = {
    events: [
        { id: 1, title: 'Company Pet Show', event_time: 'November 6 at Noon', description: 'Super-fun with furry friends!', location: 'Reston Dog Park', likes: 0, datetime_added: '2021-09-30:12:00' },
        { id: 2, title: 'Company Picnic', event_time: 'July 4th at 10:00AM', description: 'Come for free food and drinks.', location: 'Central Park', likes: 0, datetime_added: '2021-09-30:12:02' },
    ]
};

const dbEvents = { events: [] };

// health endpoint - returns an empty array
app.get('/', (req, res) => {
    res.json([]);
});

// version endpoint to provide easy convient method to demonstrating tests pass/fail
app.get('/version', (req, res) => {
    res.json({ version: '1.0.2' });
});

app.get('/events', (req, res) => {
    const sql = 'SELECT id, title, event_time, description, location, likes, datetime_added FROM events;'
    connection.query(sql, function (err, result, fields) {
        // if any error while executing above query, throw error
        if (err) {
            console.error(err.message);
            res.json(mockEvents);
        }
        else {
            // if there is no error, you have the result
            // iterate for all the rows in result
            dbEvents.events = [];
            Object.keys(result).forEach(function (key) {
                const row = result[key];
                const ev = {
                    title: row.title,
                    event_time: row.event_time,
                    description: row.description,
                    location: row.location,
                    id: row.id,
                    likes: row.likes,
                    datetime_added: row.datetime_added
                };
                dbEvents.events.push(ev);
            });
            res.json(dbEvents);
        }
    });
});

app.post('/events', (req, res) => {
    // create a new object from the json data and add an id
    const now = new Date().toUTCString();
    const ev = {
        title: req.body.title,
        event_time: req.body.event_time,
        description: req.body.description,
        location: req.body.location,
        id: mockEvents.events.length + 1,
        likes: 0,
        datetime_added: now
    }
    const sql = 'INSERT INTO events (title, event_time, description, location) VALUES (?,?,?,?);';
    const values = [ev.title, ev.event_time, ev.description, ev.location];
    connection.query(sql, values, (err, results, fields) => {
        if (err) {
            console.error(err.message);
            mockEvents.events.push(ev);
            console.log("Here " + now)
            res.json(ev.id);
        }
        else {
            // get inserted id
            console.log('Added Event Id:' + results.insertId);
            res.json(results.insertId);
        }
    });
}
);


app.get('/events/:id', (req, res) => {
    const values = [req.params.id];
    const get_likes_sql = `SELECT likes from events WHERE id = ?;`
    const update_sql = `UPDATE events SET likes = ? WHERE id = ?`;
    const get_event_sql = `SELECT id, title, event_time, description, location, likes, datetime_added FROM events WHERE id = ?;`;

    if (req.query.action == 'like') {
        connection.query(get_likes_sql, values, function (err, result, fields) {
            const new_likes = result[0].likes + 1;
            connection.query(update_sql, [new_likes, req.params.id], function (err, result, fields) {
                connection.query(get_event_sql, values, function (err, result, fields) {
                    result.length ? res.status(200).json(result[0])
                        : res.status(404).send("Not Found");
                });
            });
        });
    }
    else{
        connection.query(get_event_sql, values, function (err, result, fields) {
            result.length ? res.status(200).json(result[0])
                : res.status(404).send("Not Found");
        });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

const PORT = 8082;
const server = app.listen(PORT, () => {
    const host = server.address().address;
    const port = server.address().port;

    console.log(`Events app listening at http://${host}:${port}`);
});

module.exports = app;