# API Documentation

## Table of Contents
- [Auth Routes](#auth-routes)

## Auth Routes
- **POST /auth/login**: Login a user
- **POST /auth/logout**: Logout a user
- **GET /auth/get-me**: Retrieve the profile of the logged-in user
- **PUT /auth/change-password**: Change the password of the logged-in user
- **POST /auth/forgot-password**: Initiate password reset process
- **POST /auth/reset-password**: Complete password reset process

## User Routes
- **POST /users**: Create a new user
- **POST /users/create-admin**: Create a new admin user
- **GET /users**: Retrieve all users
- **GET /users/:id**: Retrieve a single user by ID
- **PUT /users/:id**: Update a user by ID
- **DELETE /users/:id**: Delete a user by ID

___________________________________________________________________________________

                          PRISMA VERSION INSTALL
___________________________________________________________________________________

npm i -D prisma@6.9.0
npm i @prisma/client@6.9.0
npm i @prisma/internals@6.9.0

____________________________________________________________________________________

                               Deployment
____________________________________________________________________________________ 

Step 1: convert all .ts file to .js file:
--------------------------------------------------------------------------
npm run build

Step 2: Install vercel:
---------------------------
npm i -g vercel

vercel -v (check installation)

Step 3: Login through terminal:
-----------------------------------------
vercel login

Step 4: Production:
-----------------------------------------
vercel --prod

set up and deploy?: y

Which Scope?: enter

Link to Existing: n

Whats your project name?: enter

In which Directory?: enter

go to vercel website:
https://vercel.com/dashboard

Selcet Project  And copy the link given below Domains. This is the actual production link which will work for all. Link will be like this: 

{gym-class-scheduling-and-membership-self.vercel.app}

After any changes, retype npm run build, retype vercel --prod in terminal.




