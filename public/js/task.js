import apiRequest from "./apirequest.js";

export default class Task {
  /* data is the post data from the API. */
  constructor(data) {
    this._id = data._id;
    this.dueDate = new Date(data.dueDate);
    this.text = data.text;
    this.isComplete = !data.isComplete ? false : data.isComplete;
  }

  async save() {
    let isComplete = this.isComplete;
    await await apiRequest("PATCH", `/tasks/${this._id}`, { isComplete });
    await this._reload();
  }
  async _reload() {
    let data = await apiRequest("GET", `/tasks/${this._id}`, null);
    Object.assign(this, data);
  }
}