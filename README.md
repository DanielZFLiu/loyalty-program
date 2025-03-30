To run the project locally, you have to separately initialize both backend and frontend. 

# Backend
cd to the backend folder. Then run the following commands:
```
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
node index.js 3000
```

Optionally, run `npx prisma studio` in another terminal after setting up to see the database with a more user friendly ui.

# Frontend
Open another terminal. cd to the frontend folder, then run the following commands:
```
npm install
npm run dev
```
You should see a link akin to http://localhost:5173/.
