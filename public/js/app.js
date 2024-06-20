import User from "./user.js";
import Task from "./task.js";
import GoogleAuth from "./googleauth.js";
import apiRequest from "./apirequest.js";

const clientID = "788955579882-kl380bs7j5fblif34qn52qdr2omholr5.apps.googleusercontent.com";

export default class App {
  constructor() {
    /* Store the currently logged-in user. */
    this._user = null;

    // the bindings
    this._onPost = this._onPost.bind(this);
    this._onTaskDelete = this._onTaskDelete.bind(this);
    this._onAuthentication = this._onAuthentication.bind(this);
    this._updateCountdown = this._updateCountdown.bind(this);
    this._onCheckboxClick = this._onCheckboxClick.bind(this);
    this._onLogout = this._onLogout.bind(this);
    this._onMcatSet = this._onMcatSet.bind(this);

    // the event listeners
    this._postForm = document.querySelector("#postForm");
    this._postForm.addEventListener("submit", this._onPost);
    this._taskList = document.querySelector("#taskList");

    this._authentication = new GoogleAuth(clientID);
    this._authentication.render(document.querySelector("#authentication"), this._onAuthentication);

    document.querySelector("#logoutButton").addEventListener("click", this._onLogout);
    document.querySelector("#countdownButton").addEventListener("click", this._onMcatSet);
  }
  /* Add the given Post object to the feed. */
  _displayTask(task) {
    /* Make sure we receive a Task object. */
    if (!(task instanceof Task)) throw new Error("displayTask wasn't passed a Task object");

    let elem = document.querySelector("#templatePost").cloneNode(true);
    elem.id = "";

    elem.querySelector(".time").textContent = task.dueDate.toLocaleString();
    elem.querySelector(".text").textContent = task.text;
    elem.querySelector(".profileHidden").append(task._id);
    elem.querySelector(".check").addEventListener("change", this._onCheckboxClick);
    elem.querySelector(".delete").addEventListener("click", this._onTaskDelete);

    if (task.isComplete === "true") {
      document.querySelector("#complete").append(elem);
      elem.querySelector(".check").remove();
    }
    if (task.isComplete === "false") document.querySelector("#todo").append(elem);
  }

  /* Load (or reload) a user's profile. Assumes that this._user has been set to a User instance. */
  async _loadProfile() {
    if (document.querySelector(".pfp")) {
      document.querySelector(".pfp").remove();
    }
    document.querySelector(".S9gUrf-YoZ4jf").classList.add("profileHidden");
    document.querySelector("#logoutButton").classList.remove("profileHidden");
    document.querySelector("#welcome").classList.add("hidden");
    document.querySelector("#main").classList.remove("hidden");

    // create profile information section
    document.querySelector("#dashTitle").textContent = `${this._user.name} !`;

    // Create an <img> element and set its source dynamically
    let profilePicture = document.createElement("img");
    profilePicture.className = "pfp";
    profilePicture.src = this._user.pfp;
    profilePicture.alt = "pfp";

    // Append the profile picture element to the container
    document.querySelector(".pfpContainer").append(profilePicture);

    /* Reset the feed. */
    document.querySelector("#complete").textContent = "";
    let completeTitle = document.createElement("h2");
    completeTitle.textContent = "Complete";
    completeTitle.setAttribute("class", "columnTitle");
    document.querySelector("#complete").append(completeTitle);
    document.querySelector("#todo").textContent = "";
    let todoTitle = document.createElement("h2");
    todoTitle.textContent = "Todo";
    todoTitle.setAttribute("class", "columnTitle");
    document.querySelector("#todo").append(todoTitle);

    // Update the rest of the sidebar
    this._feed = await this._user.getTasks();
    for (let post of this._feed) {
      this._displayTask(post);
    }
    await this._updateCountdown();
  }

  // tasks add and delete functionality
  async _onPost(event) {
    event.preventDefault();
    let dateInput = document.querySelector("#dateInput");
    let selectedDate = new Date(dateInput.value);
    let newTask = await this._user.makeTask(this._postForm.newPost.value, selectedDate);
    this._user.taskList[newTask._id] = new Task(newTask);
    await this._user.save();
    await this._loadProfile();
    this._postForm.reset();
  }

  async _onTaskDelete(event) {
    let taskItem = event.target.closest(".post");
    let _id = taskItem.querySelector(".profileHidden").textContent;
    await apiRequest("DELETE", `/tasks/${ _id }/`, null );
    delete this._user.taskList[_id];
    this._user.save();
    taskItem.remove();
  }

  // tasks checkbox functionality
  async _onCheckboxClick(event) {
    let checkbox = event.target;
    let _id = event.target.closest(".post").querySelector(".profileHidden").textContent;
    if (checkbox.checked) {
      this._user.taskList[_id].isComplete = "true";
      checkbox.remove();
    } else {
      this._user.taskList[_id].isComplete = "false";
    }
    let task = new Task(this._user.taskList[_id]);
    await task.save();
    await this._loadProfile();
  }

  // MCAT Countdown functionality
  async _updateCountdown() {
    let targetDate = new Date(this._user.mcatDate);
    let currentDate = new Date();
    let difference = targetDate - currentDate;
    let days = Math.floor(difference / (1000 * 60 * 60 * 24));
    let hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    let minutes = Math.floor((difference / (1000 * 60)) % 60);
    let seconds = Math.floor((difference / 1000) % 60);
    days = String(days).padStart(2, "0");
    hours = String(hours).padStart(2, "0");
    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");
    let countdownElement = document.querySelector("#countdown");
    countdownElement.textContent = `Days: ${days} Hours: ${hours} Minutes: ${minutes} Seconds: ${seconds}`;
    setTimeout(this._updateCountdown, 1000);
  }

  // setting new MCAT date
  async _onMcatSet() {
    let newDate = document.querySelector("#mcatDateInput").value;
    if (newDate) {
      this._user.mcatDate = new Date(newDate);
      await this._user.save();
      await this._loadProfile();
    }
  }

  // login functionality
  async _onAuthentication(idToken) {
    let data = await apiRequest("POST", "/login", { idToken });
    window.API_KEY = data.apiKey;
    let email = data.email;
    let pfp = data.pfp;
    let user = await User.loadOrCreate(email, pfp);
    this._user = user;
    document.querySelector(".hidden").classList.remove("hidden");
    await this._loadProfile();
  }

  // logout functionality
  async _onLogout() {
    window.API_KEY = null;
    document.querySelector("#logoutButton").classList.add("profileHidden");
    document.querySelector("#main").classList.add("hidden");
    document.querySelector("#welcome").classList.remove("hidden");
    document.querySelector(".S9gUrf-YoZ4jf").classList.remove("profileHidden");
  }
}
