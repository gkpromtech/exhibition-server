# Online exhibition REST-server

Exhibition online REST server designed to work with [Mobile application](https://github.com/gkpromtech/exhibition-android).

REST-server based on Node.js and MySQL.


### Step 1

To install all modules run script

>bash ./install_server_deps

Script downloads Node.js modules:

- mysql
- ejs
- nodemailer
- nodemailer-wellknown

### Step 2

Install MySQL server and database schema/data.
You can use database from [Exhibition Online DB](https://github.com/gkpromtech/exhibition-db) or create your own.

### Step 3

Run server

> ./start_server

In success Server will print following messages:

>Server has started.

>Deployed services: ["changes"]

### Step 4 - Test

You cat test Server with command:

>wget -qO- http://127.0.0.1:8888/changes/getUpdates?revision=0

In success Server will send following JSON response:

>{
> "revision":6314,
> "changes":[{....}]
>}
