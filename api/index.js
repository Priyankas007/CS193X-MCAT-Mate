import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

let DATABASE_NAME = "taskDatabase";
let Users;
let Tasks;

const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1";

const CLIENT_ID = process.env.CLIENT_ID || "788955579882-kl380bs7j5fblif34qn52qdr2omholr5.apps.googleusercontent.com";
const JWT_SECRET = process.env.JWT_SECRET || "763cecd3d9d3f189ed440161609038ae70bf5079ed7cbea358a2cadf623b4c0f";
let api = express.Router();

const initApi = async (app) => {
  app.set("json spaces", 2);
  app.use("/api", api);

  let conn = await MongoClient.connect(MONGODB_URL);
  let db = conn.db(DATABASE_NAME);
  Users = db.collection("users");
  Tasks = db.collection("tasks");
};

api.use(bodyParser.json());
api.use(cors());

api.get("/", (req, res) => {
  res.json({ message: "Hello, world!" });
});

/************************************------- USER ENDPOINTS ----------************************************/
// return a list of all users
api.get("/users", async (req, res) => {
  let allUsers = await Users.find().toArray();
  let users = [];
  for (let u of allUsers) {
    users.push(u.id);
  }
  res.json({ users });
});

// create a new user
api.post("/users", async (req, res) => {
  let id = req.body.id;
  if (!id) {
    res.status(400).json({ error: "Missing id" });
    return;
  }
  let user = await Users.findOne({ id });
  if (user) {
    res.status(400).json({ error: `${id} already exists.` });
    return;
  }
  await Users.insertOne({ id: id, name: "Future Doctor", mcatDate: new Date(), pfp: req.body.pfp, taskList: new Map() });
  let newUser = await Users.findOne({ id });
  delete newUser._id;
  res.json(newUser);
});

// middlewear
api.use("/users/:id", async (req, res, next) => {
  let id = req.params.id;
  let user = await Users.findOne({ id });
  if (!user) {
    res.status(404).json({ error: `No user with email ${id}` });
    return;
  }
  res.locals.user = user;
  next();
});

// return the user collection for user with id "id"
api.get("/users/:id", async (req, res) => {
  let user = res.locals.user;
  delete user._id;
  res.json(user);
});

// update a user profile
api.patch("/users/:id", async (req, res) => {
  let id = req.params.id;
  let user = res.locals.user;
  if (req.body.mcatDate !== null) {
    user.mcatDate = req.body.mcatDate;
  }
  if (req.body.taskList !== null) {
    user.taskList = req.body.taskList;
  }
  await Users.replaceOne({ id }, user );
  delete user._id;
  res.json(user);
});

// get a user's tasks
api.get("/users/:id/feed", async (req, res) => {
  let id = req.params.id;
  let user = res.locals.user;
  let retrievedTasks = await Tasks.find({ id }).toArray();
  let tasks = [];
  for (let t of retrievedTasks) {
    let taskObject = {
      "_id": t._id,
      "dueDate": t.dueDate,
      "text": t.text,
      "isComplete": t.isComplete
    };
    tasks.push(taskObject);
    await Users.replaceOne({ id }, user );
  }
  tasks.sort((a, b) => a.dueDate - b.dueDate);
  res.json({ tasks });
});

/************************************------- TASKS ENDPOINTS ----------************************************/
// middlewear
api.use("/tasks/:id", async (req, res, next) => {
  let _id = req.params.id;
  _id = new ObjectId(_id);
  let task = await Tasks.findOne({ _id });
  if (!task) {
    res.status(404).json({ error: `No task with id ${_id}` });
    return;
  }
  res.locals.task = task;
  next();
});

// return the task with _id "_id"
api.get("/tasks/:id", async (req, res) => {
  let task = res.locals.task;
  delete task._id;
  res.json(task);
});

// make a new task for a user
api.post("/users/:id/tasks", async (req, res) => {
  let text = req.body.text;
  let dueDate = req.body.dueDate;
  if (!text || !dueDate) {
    res.status(400).json({ error: "Missing text or DueDate" });
    return;
  }
  let date;
  date = dueDate.split(new RegExp("-", "g"));
  let year = date[0];
  let month = date[1];
  let day = date[2];
  let taskDate = new Date(parseInt(year), parseInt(month), parseInt(day));

  let taskObject = {
    "id": req.params.id,
    "dueDate": taskDate,
    "text": text,
    "isComplete": "false"
  };
  let response = await Tasks.insertOne(taskObject);
  let _id = response.insertedId;
  let task = await Tasks.findOne({ _id });
  res.json(task);
});

// update a tasks completion
api.patch("/tasks/:id", async (req, res) => {
  if (!req.body.isComplete) {
    res.status(404).json({ error: `Missing isComplete update` });
    return;
  }
  let task = res.locals.task;
  task.isComplete = req.body.isComplete;
  await Tasks.replaceOne({ _id: task._id }, task );
  delete task._id;
  res.json(task);
});

// delete a task
api.delete("/tasks/:id/", async (req, res) => {
  let task = res.locals.task;
  let result = await Tasks.deleteOne({ _id: task._id });
  if (result.deletedCount === 1) {
    res.json({ "success": true });
  } else {
    res.status(400).json({ error: `task with id ${_id} did not get deleted` });
    return;
  }
});


/************************************------- AUTHENTICATION ENDPOINTS ----------************************************/
api.use("/protected", async (req, res, next) => {
  /* Return an authentication error. */
  const error = () => { res.status(403).json({ error: "Access denied" }); };
  let header = req.header("Authorization");
  /* `return error()` is a bit cheesy when error() doesn't return anything, but it works (returns undefined) and is convenient. */
  if (!header) return error();
  let [type, value] = header.split(" ");
  if (type !== "Bearer") return error();
  try {
    let verified = jwt.verify(value, SECRET);
    //TODO: verified contains whatever object you signed, e.g. the user's email address.
    let user = await Users.findOne({ email: verified });
    if (!user) {
      res.status(404).json({ error: `No user with email ${id}` });
      return;
    }
    res.locals.user = user;
    //Use this to look up the user and set res.locals accordingly
    next();
  } catch (e) {
    console.error(e);
    error();
  }
});

api.post("/login", async (req, res) => {
  let idToken = req.body.idToken;
  let client = new OAuth2Client();
  let data;
  try {
    /* "audience" is the client ID the token was created for. A mismatch would mean the user is
       trying to use an ID token from a different app */
    let login = await client.verifyIdToken({ idToken, audience: CLIENT_ID });
    data = login.getPayload();
  } catch (e) {
    /* Something when wrong when verifying the token. */
    console.error(e);
    res.status(403).json({ error: "Invalid ID token" });
  }

  /* data contains information about the logged in user. */
  let email = data.email;
  let name = data.name;
  let pfp = data.picture;
  //TODO: Do whatever work you'd like here, such as ensuring the user exists in the database
  /* You can include additional information in the key if you want, as well. */
  let apiKey = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });
  res.json({ apiKey, email, name, pfp });
});


/* Catch-all route to return a JSON error if endpoint not defined.
   Be sure to put all of your endpoints above this one, or they will not be called. */
api.all("/*", (req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});

export default initApi;
