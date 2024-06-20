import apiRequest from "./apirequest.js";
import Task from "./task.js";

const DEFAULT_AVATAR_PATH = "images/default.png";

/* A data model representing a user of the app. */
export default class User {
  /* Returns a User instance, creating the user if necessary. */
  static async loadOrCreate(id, pfp) {
    let user = null;
    try {
      let res = await apiRequest("GET", `/users/${id}`, null);
      user = new User(res);
    } catch (e) {
      console.log(e);
      let newRes = await apiRequest("POST", "/users", { id, pfp });
      user = new User(newRes);
    }
    return user;
  }

  /* data is the user object from the API. */
  constructor(data) {
    Object.assign(this, data);
    this.mcatDate = new Date(data.mcatDate);
  }

  /* The string representation of a User is their display name. */
  toString() {
    return this.name;
  }

  /* Returns an Object containing only the instances variables we want to send back to the API when we save() the user. */
  toJSON() {
    let options = {
      id: this.id,
      name: this.name,
    };
    return options;
  }

  /* Save the current state (name and mcatDate URL) of the user to the server. */
  async save() {
    let name = this.name === "" ? this.id : this.name;
    let mcatDate = this.mcatDate === null ? new Date() : this.mcatDate;
    let taskList = this.taskList;
    let body = { name, mcatDate, taskList };
    await apiRequest("PATCH", `/users/${this.id}`, body);
    await this._reload();
  }

  /* Gets the user's current feed. Returns an Array of Post objects. */
  async getTasks() {
    let res = await apiRequest("GET", `/users/${this.id}/feed`, null);
    let feed = [];
    for (let t of res.tasks) {
      let p = new Task(t);
      feed.push(p);
    }
    return feed;
  }

  /* Create a new task with the given text and due date. */
  async makeTask(text, dueDate) {
    let task = await apiRequest("POST", `/users/${this.id}/tasks`, { text, dueDate });
    await this.getTasks();
    return task;
  }

  async _reload() {
    let data = await apiRequest("GET", `/users/${this.id}`, null);
    Object.assign(this, data);
  }
}

