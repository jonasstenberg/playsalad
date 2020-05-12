# salad-bowl

## Install

* Clone the repository:

```sh
git clone git@github.com:jonasstenberg/salad-bowl.git
```

* Install the latest [Node LTS](https://nodejs.org/en/)

* Install [SQLite3](https://www.sqlite.org/index.html)

* Install dependencies:

```sh
npm install
```

* Create a database:

```sh
cd backend && sqlite3 state.db < db/schema.sql
```

## Usage

Start the server

```sh
cd backend && npm start
```

Start the client

```sh
cd client && npm start
```
