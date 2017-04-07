![logo](https://static.creatordev.io/logo-md-s.svg)

# Sesame - Creator garage door opener controller
* https://info.ba.imgtec.org/display/IM/WEB+API+specification
* https://info.ba.imgtec.org/pages/viewpage.action?spaceKey=IM&title=Sesame+-+Creator+garage+door+opener+controller
* https://tools.ietf.org/html/rfc6750

---

### Keywords:
* HATEOAS
* Heroku
* mLab

## Architecture
![Architecture](images/sesame1.jpg)

## Jump Start

There are two ways to use the Webapp:

1. Cloud Deployment
2. Locally

---

## Cloud Deployment

This guide explains the process of cloud deploying the Webapp to Heroku and mLab,
using their free tiers. However the performance can be improved using a payed service,
or if you prefer different hosting services: AWS, Google Cloud, etc.

### 1. Get the project

1. Clone the project from git repository
2. Rename file **config.js.sample** **into config.js** located in project root directory

### 2. Developer Console - Create Account

1. Create a [Developer Console](https://console.creatordev.io) account
2. Generate a set of API Keys
3. Insert the API Keys into the **config.js file**

### 3. IFTTT - configure alerts via email/sms (optional)

You can receive email and/or sms notifications about door issues. For that you need create applets on IFTTT service.
1. Create an account on IFTTT service.
2. Connect your account with "Maker channel" service. Select the service from list, click "connect" button and follow instructions.
3. Once connected you can create your applet. From top menu select "my applets" and click "new applet".
4. As a trigger select Maker Channel applet.
5. As a event use one of two provided by sesame web app:
    * **doorstuck** is used to notify you when door couldn't reach end position
    * **maintenance** is used to notify you when door needs maintenance
    * **lock** is used when the webapp sucessfully applies the software door lock as a result of the webapp's lock webhook
    * **unlock** is used when the webapp sucessfully deactivates the software door lock status
6. As a action service choose anything you want. Eg you can use email service to get notifications via email or sms service to get them on your phone.
7. Create as many applets you want.
8. Go back to web app source code. Edit config.js file end enable ifttt module by setting flag **enabled** to true.
9. Also provide your ifttt key in config.js file. Key can be found under your ifttt acount in your profile -> services -> maker -> settings

### 4. mLab - Create the DB (Manual Setup)
1. Sign up for an [mlab free account](https://mlab.com/)
2. Create a new database (select Single Node, Sandbox for the free tier)
3. Add a user
4. Get the database URI (connection string) visible on the dashboard:
mongodb://`<`dbuser`>`:`<`dbpassword>@`<`dbuser`>`.mlab.com:`<`port`>`/`<`db_name`>`
5. Complete the connection string with your account details. Save the connection
string as mongo db configuration: **$ heroku config:set MONGOLAB_URI=your_db_uri**

### 5. Heroku - Push The Webapp Source Code

1. Create an [Heroku account](https://www.heroku.com/)
2. Install [Heroku Command Line Interface (CLI)](https://devcenter.heroku.com/articles/heroku-command-line)
3. Enter your Heroku credentials: **$ heroku login**
4. Create the application on Heroku: **$ heroku create**
5. Edit config.js file and set HOST to an url to Your heroku app instance.
5. Deploy the application on Heroku: **$ git push heroku master**
6. Test the live application: **$ heroku open**


---

## Start The Web App (Locally)

1. Get the project, by ZIP download or git clone
2. Install [**Node.js LTS**](https://nodejs.org/en/)
3. Install the Webapp's dependencies. On projects root directory, execute:
**$ npm install**
4. Insert the API Keys into the **config.js file**, located in your projects root
folder.
5. Insert your hostname in **config.js file**. Remember that you need a **proxy** in order to get notifications from Device Server.
5. Install MongoDB
6. Use a **proxy** (e.g. Ngrok) to expose the local application on an https server
7. Start the application: **$ npm start**

**Summary:**
* **$ npm install**
* **$ npm start**

---

## POSTMAN Collection

POSTMAN is a REST client useful to test the Webapp.The following button opens
the **REST API** on POSTMAN, designated by POSTMAN Collection.

**NOTE:** It can be necessary to adjust some variables on POSTMAN environment
to run the  collection.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/69dffcacaa53e10ec306)


## REST Endpoints

Documentation of REST API can be generated right from source code. From root directory of the project call
```
npm install apidoc
apidoc -i ./api_v1
```

Generated documentation can be found in **doc** directory.

## Authentication
Web app uses [Json Web Token](https://jwt.io/) to authorize incoming request.
Each request sent to webapp needs an authorization header. This is
```
x-access-token : token
```

Token is based on your app secret from **config.js file** and can be generated either on above website or using script
from inside this project.

Just call:
```
node ./generateJsonToken.js
```
and use generated token to sign Your requests.



