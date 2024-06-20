CS193X Final Project
====================

Project Title: MCAT MATE
Your Name: Priyanka Shrestha
Your SUNetID: shrestp

Overview
--------
MCAT MATE is a website that allows users to create and manage their MCAT study schedule by being able to add and remove tasks they need to accomplish
and keep track of how many days are left until their MCAT date.

Running
-------
npm install, npm start.

Do we need to load data from init_db.mongodb? No. Once you login and add tasks data will become stored in MongoDB in two databases, "Users" and "Tasks". 

Features
--------
* Google authentication log in on top right hand corner.
* MCAT Countdown at the top allows a user to select the calendar date on which they have their MCAT. By switching the date and clicking "set" the countdown
will automatically update and show the new countdown for the new date.
* Add a new task allows users to add a description and due date for a task. Tasks will show up in chronological order in the "TO DO" column.
* By clicking the small checkbox on a task object the task will be moved to the "Complete" column
* The "delete" button allows users to delete tasks from either column
* I used a colorblind friendly palette for accesibility to choose colors


Collaboration and libraries
---------------------------
I used the guide online on how to create a google authentication from the CS193x website. I consulted pre-med students and
current first year medical students on what kinds of features would be most useful for such a website. 

Anything else?
-------------
I really enjoyed the course and coming from no background in web development thought that it was a great overview course
and has equipped me with the tools to be able to learn more web dev whenever I may need to in the future.
