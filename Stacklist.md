---
categories:
  - "[[Ideas]]"
  - "[[Project Ideas]]"
---


These are silly things we can feed in to the machine. Let's make some chaos on the internet.

---

"Stacklist" is a directory of all of the "stacks" that people have invented. A "stack" is something like the "JAM stack", which refers to Javascript, Angular, and Mongo. "Stacks" are just a group of technologies that have been found to work well together.

People _really_ like to claim that they invented a stack, but since it's just a list of technologies you stuck together in a word, there's no reason we can't just lay our claim to them any time we want.

Stacklist lets you create your own stack by picking your technologies and arranging them in an order to make a word. You build a stack by clicking on the "Design my Stack" button on the homepage, which takes you to a stack builder interface. You select each technology from a picklist, OR you add a new one by providing a name and a link to a github repo. Added technologies can be dragged to reorder them, and at the top of the page, it proudly displays the name of your stack (as you make it): "The {{stackname}} Stack!"

The only limitation to stacks is that their acronym (which will become their URL) MUST BE UNIQUE. Only ONE person can have ever invented the SALSA stack, and anyone else coming around should not be able to do it again, EVEN IF they are totally different technologies.

To save your stack, users need to log in with their GitHub user, and once complete, the stack will be saved in the database along with when it was invented and who it was invented by.

Logged in users can "star" stacks on the detail pages of them, and on the home page there are two columns showing the most-starred stacks and the other showing the most recently created stacks.

Stack detail pages should be easy to find simply by going to their acronym (e.g. `stacklist.com/salsa`). If a stack does NOT exist already, that page should show a CTA that invites the user to invent their own and claim it for themselves.

The list of technolgies in the stack creator page should be prepopulated from the existing list of technologies stored in the database.
