<p align="center">

<img src="https://image.ibb.co/e1jeGT/icon_800x800.png" width="80" style="margin-bottom:-10px">

<h1 align="center" style="margin-top:-25px">Grammarer</h1>

<p align="center">A grammar and vocab learning platform for schools.</p>

</p>


![Grammarer screenshot](https://image.ibb.co/kzWOAo/frame_chrome_mac.png)

### Simple but effective grammar revision
Students will love Grammarer - it offers a **fun and super-simple solution** to revising both grammar and vocab in a portable and modern way. Admins will also love it for its simplicity and **easy setup process**.

Grammarer is **fully customisable**. Every colour. Every icon. Every title. Everything can be changed using the `gm-options.json` file.

![Grammarer gif](https://image.ibb.co/iXUobT/capture.gif)

### Full user management system
Grammarer has a full user management system, powered by [MongoDB](https://www.mongodb.com/). Each user is given a **1-7 digit code** made of and is assigned to a cohort (a class) of other students. The cohort can then be assigned lists to access. This allows students to **store their progress** on the server and access **averages and graphs to see their improvement**. Teachers can assign new codes and delete ones they don't need. They can even **auto-generate a sheet** of 16 printable codes.

### Your own colours
As mentioned earlier, Grammarer is completely customisable. You can make it look however you want. Your own colours, pictures and text.

![Grammarer in custom colours](https://image.ibb.co/heAEi8/frame_chrome_mac_1.png)

# Get started
Grammarer is extremely simple to set up, but you'll need some basic knowledge of JavaScript and the command line, as well as a server to run it on. You'll also need to be relatively experienced with MongoDB as you will need to be handling Mongo queries to add grammar/vocab lists.

1. First, make sure **NodeJS is installed**. You can try by running `node -v` in a command line. It should return something similar to `v8.9.4`. If not, visit [the NodeJS download page](https://nodejs.org/en/download/) and download it. It comes pre-packaged with NPM, which is also required for running Grammarer.

2. Make sure **MongoDB is installed and running**. MongoDB is required to control the database of Grammarer. You can either host it locally (see [this](https://docs.mongodb.com/manual/administration/install-community/)) or through [Mongo Atlas](https://www.mongodb.com/cloud/atlas)

3. Enter the directory that you want to contain the Grammarer source files in, and run:

```bash
git clone https://github.com/palkerecsenyi/grammarer.git
```

4. Enter the directory that the files were cloned into, and run:

```bash
npm install
```

5. Open `gm-options.json` with your favourite text editor. Here is what it should look like:

```json
{
  "organisation": {
    "name": "Example School",
    "logo": "img/example_school.png",
    "primaryColour": "#5fe85a",
    "secondaryColour": "#4fbc4b",
    "aboutPage": true
  },
  "rootUrl": "localhost",
  "ports":{
    "development": "3000",
    "production": "80"
  },
  "dbString": "mongodb://localhost:27017",
  "features": [
    "grammar",
    "vocab",
    "printables"
  ],
  "languages": [
    "greek"
  ],
  "printables": [
    {
      "language": "Greek",
      "name": "Adjectives",
      "fileName": "y9_gratin_greek_adj.pdf"
    },
    {
      "language": "Greek",
      "name": "Definite Article",
      "fileName": "y9_gratin_greek_defart.pdf"
    }
  ]
}
```

5. Edit the file to match your needs.

| Name         | Type             | Description                                                                                                                                                                                                                                                           |
|--------------|------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| organisation | object           | Customisation definitions for your deployment of Grammarer. Every option is shown in the example above - the logo can be found in `frontend/img/example_school.png` and the `aboutPage` option states whether a page about Grammarer should be made available.        |
| rootUrl      | string           | The base URL the Grammarer will be hosted on. This should include http:// or https://.                                                                                                                                                                                |
| ports        | object           | Contains the 'development' and 'production' values which define the port to host Grammarer on in each dev environment                                                                                                                                                 |
| dbString     | string           | The MongoDB address for the database. In many cases, this will be `mongodb://localhost:27017`, but it will be different if you are using Atlas.                                                                                                                      |
| features     | array of strings | An array of three different items - 'grammar', 'vocab' and 'printables' - to define which features should be enabled. Simply remove one to disable it.                                                                                                                |
| languages    | array of strings | An array of the languages used in your implementation of Grammarer. These must start with a **lowercase character**                                                                                                                                                   |
| printables   | array of objects | **Only required if printables are enabled.** Each object should contain `language` to show the language of the printable (starting with an uppercase character), `name` to describe the printable and `fileName` to state the file path relative from `frontend/pdf`. |

# Setup and run
1. Once you have made the appropriate changes to `gm-options.json` and removed unnecessary demo data, you can run the automatic build script. Just simply type:

```bash
node setup.js
```

2. If this completes without error, you are ready to start the Grammarer server. If you do encounter an error, it will probably explain the issue and where it ocurred. To start the server, type:

```bash
npm start
# or
npm run start-dev
```

3. That's it! Visit the URL it shows in a web browser and sign in with the **default code 'admin'**. You can then access the 'Magic Dashboard' to create new users.

# Further customisation
You can choose to customise Grammarer using the `gm-options.json` file. The `organisation` object contains most customisation options:

| Name            | Type    | Description                                                                                                                           |
|-----------------|---------|---------------------------------------------------------------------------------------------------------------------------------------|
| name            | string  | The name of your organisation                                                                                                         |
| logo            | string  | The logo of your organisation, relative the the `frontend` directory                                                                  |
| primaryColour   | string  | The HEX colour code for the main colour of your organisation                                                                          |
| secondaryColour | string  | The HEX colour code for the secondary colour of your organisation - this is usually just the colour 30% darker than `primaryColour`.  |
| aboutPage       | boolean | Whether a descriptive page that introduces the Grammarer project should be shown - file can be changed in `frontend/views/about.html` |

However, these options may not be sufficient for you. In this case, you can start by editing the four CSS files in `frontend`:

| File name    | Content                                                                                                                                  |
|--------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `loader.css` | Special markup to customise the centered loader spinner - see [this](https://github.com/chieffancypants/angular-loading-bar)             |
| `mobile.css` | A tiny set of mobile-adapting customisations - not a lot to change here                                                                  |
| `navbar.css` | Defines colours and styles for the Bulma navbar - colours are auto-set by setup.js                                                       |
| `table.css`  | Defines the table used for the actual grammar and vocab tables - selected, revealed, right and wrong are all state classes set by jQuery |

On top of this, you can also change the HTML files in `frontend/views` or the main view container in `frontend/index.html`. Satisfied now?

# Adding grammar/vocab lists
All lists are defined in the `lists` collection within the `grammarer-db` database. If this doesn't exist (it isn't created by default), you will need to add it manually. It's easiest to do this through [Mongo Compass](https://www.mongodb.com/products/compass), a desktop MongoDB client. You will also need the MongoDB CLI to insert large JSON objects in their original format.

**Grammar and vocab lists can now be added through a simple and friendly GUI by an admin user. Simply sign in and click Magic Dashboard > Create and manage grammar/vocab lists > Add grammar list/Add vocab list.**

Grammar and vocab lists have slightly different structures so they are explained separately.

### Grammar
You can see an example [here](https://gist.github.com/palkerecsenyi/8001e12754b29c6ab295a1aa4017b707).

The object starts with some global definitions to identify the list:

| Name         | Type   | Content                                                                                                                                                                           |
|--------------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `title`      | string | A human-readable name to describe the list                                                                                                                                        |
| `language`   | string | The language of the list, starting with **a capital letter**. This must be registered in the `languages` array in `gm-options.json` but with a **lowercase letter** in that case. |
| `identifier` | string | A machine-readable unique identifier (unique across **the whole database**)                                                                                                       |
| `results`    | array  | Must be an empty array, but must be defined. Results will get placed in here automatically.                                                                                       |
| `type`       | string | In this case, this will be `grammar` but it can also be `vocab`                                                                                                                   |

Next, you need to define the `maxPosition` array. This contains two integers, depending on which way you want the cursor to move through the list when it is practised:

| Direction | Integers                                            |
|-----------|-----------------------------------------------------|
| Left      | 0 = Amount of rows :: 1 = Amount of columns |
| Down      | 0 = Amount of columns :: 1 = Amount of rows |

Finally, you need to define the actual table itself, using the `table` key, which contains an object.

| Name | Type | Content |
|--------|------------------|---------------------------------------------------------------------------------------------|
| `head` | array of strings | Each string defines a static piece of text to go in the head of the table (the first row) |
| `rows` | array of objects | An array of every row (except the head) to be placed in the table. Each object should contain **Object A** (see below) |

##### Object A

| Name | Type | Content |
|---------|------------------|-------------------------------------------------------------------------------------------------|
| `first` | string | A static piece of text to go in the first column of the row (e.g. 'Nominative') |
| `cells` | array of objects | An array of every dynamic (non-static) column to be placed in the row. Each object should contain **Object B** (see below) |

##### Object B

| Name | Type | Content |
|--------|---------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `name` | string | The text to go in the cell. This will be hidden when the game is being played, but revealed when the 'Reveal' button is pressed. |
| `id` | string (two consequent numbers) | The position of the cell in the table, in the same syntax as the `maxPosition` property, except as a combined string.

### Vocab

Vocab checklists are much simpler to build, as they only involve two definitive columns. They start with the same general definitions as in the first table of the [Grammar](#grammarer) list.

An example is available [here](https://gist.github.com/palkerecsenyi/bf4761928d8955e011c71f0ce2e509ce)

Instead of the `maxPosition` array, you need to use `vocabLength` to define the linear length of the vocab list - this should be an **integer**.

Instead of the `table` property, you need to use the `list` array to define items. Each item in this array should be an **object**, containing two values:

| Name | Type | Content |
|------------|--------|--------------------------------------------------------------------------|
| `original` | string | The original definition of the word, in the given language (not English) |
| `english` | string | The English translation of the word. |

When playing the vocab is a normal user, the two languages can be easily swapped around using the `Swap languages` button.

# User control
All user control can be done through the 'Magic Dashboard'. You can access this by clicking the small link at the bottom of the page shown to you once you sign in. **Only users with the role `teacher` or `admin` can access the dashboard.**

In Grammarer, a cohort represents a `class` of students and teacher(s). For example, a cohort could be `y9_german_1`. Most schools have their own naming convention for classes, which they can use easily with Grammarer. Every user belongs to a cohort, and only one cohort. If a teacher teaches multiple classes or a student takes multiple classes, they will need separate codes for each. By default, the `admins` cohort is created and the `admin` user is placed inside it. **Both of these should be deleted immeadiately** in order to avoid security issues.

The default user can enter the dashboard and use the various tools, tabs and modals to create, delete and modify users and cohorts.

# License and Attributions
Grammarer is licensed under the MIT license, available [here](https://github.com/palkerecsenyi/grammarer/blob/master/LICENSE.md). Any contribution is welcome and everything will be considered.

Grammarer would not be possible without:

* Bulma.io CSS framework
* AngularJS + router + animate
* Cfp-Angular-Loading-bar
* jsPdf PDF generator
* jQuery
* NodeJS
* MongoDB
* Mocha

