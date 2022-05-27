'use strict';

// Going to connect to MySQL database
const mysql = require('mysql');

const create_table_sql = `CREATE TABLE events(
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    event_time VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    likes INT DEFAULT 0,
    datetime_added TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ( id ));`

const add_record_sql = `INSERT INTO events (title, event_time, description, location) 
VALUES ('Company Pet Show (DB)', 'November 6 at Noon', 
'Super-fun with furry friends!', 'Reston Dog Park'),
('Company Picnic (DB)', 'July 4th at 10:00AM', 
'Come for free food and drinks.', 'Central Park');`

function init_database() {
    const HOST = process.env.DBHOST ? process.env.DBHOST : "127.0.0.1";
    const USER = process.env.DBUSER ? process.env.DBUSER : "root";
    const PASSWORD = process.env.DBPASSWORD ? process.env.DBPASSWORD : "letmein!";
    const connection = mysql.createConnection({
        host: HOST,
        user: USER,
        password: PASSWORD,
    });
    connection.connect(function (err) {
        if (err) {
            console.error(err.message);
        }
        else {
            console.log("Connected!");
            // Ensure the database doesn't exist
            connection.query("DROP DATABASE IF EXISTS events_db;", function (err, result) {
                console.log("Dropped Database");
                // Create the database
                connection.query("CREATE DATABASE events_db;", function (err, result) {
                    // Switch to the database
                    connection.query("USE events_db;", function (err, result) {
                        console.log("Switched Database");
                        // Create the Table
                        connection.query(create_table_sql, function (err, result) {
                            console.log("Table created");
                            // Add a Record
                            connection.query(add_record_sql, function (err, result) {
                                console.log("Records added");
                                succeeded = true;
                            });
                        });
                    });
                });
            });
        }
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

let tries = 0;
let succeeded = false;
let sleep_time = 1;
async function start() {
    while (!succeeded && tries < 10) {
        tries++;
        init_database();
        console.log(sleep_time);
        await sleep(sleep_time * 1000);
        sleep_time >= 64 ? sleep_time = sleep_time : sleep_time *= 2
        console.log(new Date().toLocaleTimeString());
    }
    console.log("Exiting");
    process.exit();
}

start()

