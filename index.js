import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import ejs from "ejs";
import { fileURLToPath } from "url";
import path from "path";
import { dirname, join } from "path";
import cors from "cors";
import env from "dotenv";
import { sql } from "@vercel/postgres";

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
env.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
});

pool.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Error connecting to the database', err));

app.use(cors());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static("public"));
app.use(express.static(__dirname + "/public/"));

let items;

app.get("/", async (req, res) => {
  try {
    let allItems = await pool.query("SELECT * FROM items ORDER BY id ASC");
    items = allItems.rows;
    res.render("index.ejs", {
      listTitle: "Today",
      listItems: items,
    });
  } catch (error) {
    console.log("Error: ", error);
  }
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  try {
    await pool.query("INSERT INTO items (title) VALUES ($1)", [item]);
    res.redirect("/");
  } catch (error) {
    console.log("error : ", error);
  }
});

app.post("/edit", async (req, res) => {
  const item = req.body.updatedItemTitle;
  const id = req.body.updatedItemId;
  try {
    const edited = await pool.query(
      "UPDATE items SET title = ($1) WHERE id = ($2)",
      [item, id]
    );
    console.log(edited.rows);
    res.redirect("/");
  } catch (error) {
    console.log("Error : ", error);
  }
});

app.post("/delete", async (req, res) => {
  const item = req.body.deleteItemId;
  try {
    await pool.query("DELETE FROM items WHERE id = $1", [item]);
    res.redirect("/");
  } catch (error) {
    console.log("error: ", error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
