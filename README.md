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
Grammarer has a full user management system, powered by [MongoDB](https://www.mongodb.com/). Each user is given a **1-7 digit code** made of numbers and a prefix to represent the teacher it was assigned by. This allows students to **store their progress** on the server and access **averages and graphs to see their improvement**. Teachers can assign new codes and delete ones they don't need. They can even **auto-generate a sheet** of 16 printable codes.

### Your own colours
As mentioned earlier, Grammarer is completely customisable. You can make it look however you want. Your own colours, pictures and text.

![Grammarer in custom colours](https://image.ibb.co/heAEi8/frame_chrome_mac_1.png)

# Get started
Grammarer is extremely simple to set up, but you'll need some basic knowledge of JavaScript and the command line, as well as a server to run it on.

1. First, make sure **NodeJS is installed**. You can try by running `node -v` in a command line. It should return something similar to `v8.9.4`. If not, visit [the NodeJS download page](https://nodejs.org/en/download/) and download it. It comes pre-packaged with NPM, which is also required for running Grammarer.

2. Make sure **MongoDB is installed and running**. MongoDB is required to control the database of Grammarer. You can either host it locally (see [this](https://docs.mongodb.com/manual/administration/install-community/)) or through [Mongo Atlas](https://www.mongodb.com/cloud/atlas)

3. Enter the directory that you want to contain the Grammarer source files in, and run:

![git clone https://github.com/palkerecsenyi/grammarer.git](https://image.ibb.co/gpKeGT/carbon.png)

4. Enter the directory that the files were cloned into, and edit `gm-options.json` with your favourite text editor. Here is what it should look like:

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
| organisation | object           | Customisation definitions for your deployment of Grammarer. Every option is shown in the example above - the logo can be found in `frontend/img/example_school.png`.                                                                                                  |
| rootUrl      | string           | The base URL the Grammarer will be hosted on. This should include http:// or https://.                                                                                                                                                                                |
| ports        | object           | Contains the 'development' and 'production' values which define the port to host Grammarer on in each dev environment                                                                                                                                                 |
| dbString     | string           | The MongoDB address for the database. In many cases, this will be `mongodb://localhost:27017`, but it will be different if your are using Atlas.                                                                                                                      |
| features     | array of strings | An array of three different items - 'grammar', 'vocab' and 'printables' - to define which features should be enabled. Simply remove one to disable it.                                                                                                                |
| languages    | array of strings | An array of the languages used in your implementation of Grammarer. These must start with a **lowercase character**                                                                                                                                                   |
| printables   | array of objects | **Only required if printables are enabled.** Each object should contain `language` to show the language of the printable (starting with an uppercase character), `name` to describe the printable and `fileName` to state the file path relative from `frontend/pdf`. |